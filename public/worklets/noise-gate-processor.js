/**
 * Noise Gate AudioWorklet Processor
 *
 * Sample-accurate gate running in the audio thread, so it keeps working when
 * the tab is in the background (main-thread timers are throttled there).
 *   - Peak envelope follower measures the input level
 *   - Opens at the threshold, closes a few dB below it (hysteresis) so a note
 *     decaying through the threshold does not make the gate chatter
 *   - Gain slews linearly: fully open after `attack` seconds, fully closed
 *     after `release` seconds
 *
 * Parameters (k-rate, must match noiseGateNode.ts):
 *   threshold — level that opens the gate, in dBFS (peak)
 *   attack    — fade-in time in seconds
 *   release   — fade-out time in seconds
 */

// Message that tells the processor its node was disposed
// (must match WORKLET_DISPOSE_MESSAGE_TYPE in src/lib/constants/dsp.ts)
const DISPOSE_MESSAGE_TYPE = 'dispose';

// ── Level detector ───────────────────────────────────────────────────
// The detector jumps to each new peak and decays between them. The decay must
// be slow enough to bridge one full cycle of the lowest guitar notes (~16 ms
// for a 7-string low B) without the level drooping past the hysteresis band.
const DETECTOR_RELEASE_MS = 50;

// Gap between the opening and closing thresholds
const HYSTERESIS_DB = 4;

// Envelope values below this are treated as silence — keeps the decaying
// envelope from sinking into slow denormal floats
const ENVELOPE_FLOOR = 1e-8;

function dbToLinear(db) {
  return Math.pow(10, db / 20);
}

class NoiseGateProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'threshold', defaultValue: -45, minValue: -100, maxValue: 0, automationRate: 'k-rate' },
      { name: 'attack', defaultValue: 0.005, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'release', defaultValue: 0.1, minValue: 0, maxValue: 5, automationRate: 'k-rate' },
    ];
  }

  constructor() {
    super();

    this._isDisposed = false;
    this._envelope = 0;
    this._isOpen = false;
    this._gain = 0;
    this._detectorReleaseCoeff = Math.exp(-1 / (DETECTOR_RELEASE_MS * 0.001 * sampleRate));

    // dB → linear conversion is cached and redone only when the threshold changes
    this._thresholdDb = Number.NaN;
    this._openLevel = 0;
    this._closeLevel = 0;

    this.port.onmessage = (event) => {
      if (event.data.type === DISPOSE_MESSAGE_TYPE) {
        this._isDisposed = true;
      }
    };
  }

  process(inputs, outputs, parameters) {
    // Returning false lets the browser release a disposed processor
    if (this._isDisposed) return false;

    const input = inputs[0];
    const output = outputs[0];
    const channelCount = Math.min(input.length, output.length);

    // Nothing connected upstream — the output is already silent; start closed next time
    if (channelCount === 0) {
      this._envelope = 0;
      this._isOpen = false;
      this._gain = 0;
      return true;
    }

    const thresholdDb = parameters.threshold[0];
    if (thresholdDb !== this._thresholdDb) {
      this._thresholdDb = thresholdDb;
      this._openLevel = dbToLinear(thresholdDb);
      this._closeLevel = dbToLinear(thresholdDb - HYSTERESIS_DB);
    }

    // Per-sample gain steps; a time of zero means "jump within one sample"
    const attackSamples = parameters.attack[0] * sampleRate;
    const releaseSamples = parameters.release[0] * sampleRate;
    const attackStep = attackSamples > 1 ? 1 / attackSamples : 1;
    const releaseStep = releaseSamples > 1 ? 1 / releaseSamples : 1;

    // State lives in locals for the duration of the block. Nothing in this loop
    // may allocate: this is the real-time audio thread.
    const openLevel = this._openLevel;
    const closeLevel = this._closeLevel;
    const detectorReleaseCoeff = this._detectorReleaseCoeff;
    let envelope = this._envelope;
    let isOpen = this._isOpen;
    let gain = this._gain;

    const blockSize = input[0].length;
    for (let i = 0; i < blockSize; i++) {
      // Loudest channel drives the detector so all channels gate together
      let peak = 0;
      for (let ch = 0; ch < channelCount; ch++) {
        const magnitude = Math.abs(input[ch][i]);
        if (magnitude > peak) peak = magnitude;
      }

      if (peak > envelope) {
        envelope = peak;
      } else {
        envelope *= detectorReleaseCoeff;
        if (envelope < ENVELOPE_FLOOR) envelope = 0;
      }

      if (isOpen) {
        if (envelope < closeLevel) isOpen = false;
      } else if (envelope >= openLevel) {
        isOpen = true;
      }

      if (isOpen) {
        gain += attackStep;
        if (gain > 1) gain = 1;
      } else {
        gain -= releaseStep;
        if (gain < 0) gain = 0;
      }

      for (let ch = 0; ch < channelCount; ch++) {
        output[ch][i] = input[ch][i] * gain;
      }
    }

    this._envelope = envelope;
    this._isOpen = isOpen;
    this._gain = gain;

    return true;
  }
}

registerProcessor('noise-gate-processor', NoiseGateProcessor);
