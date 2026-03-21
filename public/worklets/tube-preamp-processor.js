/**
 * Tube Preamp AudioWorklet Processor
 *
 * Sample-by-sample DSP running in a dedicated audio thread.
 * Features:
 *   - 4x oversampling with linear-phase anti-alias filtering
 *   - Per-amp-type waveshaping curves (clean, crunch, highgain, acoustic)
 *   - Optional cascaded second stage (highgain only)
 *   - Power supply sag via RC envelope follower
 *   - DC blocking after each nonlinear stage
 */

// ── Amp type indices (must match tubePreampConstants.ts) ──────────────
const AMP_TYPE_CLEAN = 0;
const AMP_TYPE_CRUNCH = 1;
const AMP_TYPE_HIGHGAIN = 2;
const AMP_TYPE_ACOUSTIC = 3;

// ── Oversampling ─────────────────────────────────────────────────────
const OVERSAMPLE_FACTOR = 4;

// Half-band FIR anti-alias filter (linear-phase, 15-tap)
// Designed for 4x oversampled rate — stops aliasing from fold-back
const AA_FILTER_TAPS = [
  -0.0018, 0.0, 0.0098, 0.0, -0.0378, 0.0, 0.1134, 0.25,
  0.3164, 0.25, 0.1134, 0.0, -0.0378, 0.0, 0.0098,
];
const AA_FILTER_LENGTH = AA_FILTER_TAPS.length;

// ── Preamp boost per amp type ────────────────────────────────────────
const PREAMP_BOOST = [
  8,  // clean
  6,  // crunch
  8,  // highgain
  8,  // acoustic
];

// ── DC block one-pole highpass coefficient ────────────────────────────
// fc ≈ 20 Hz at 44100 × 4 = 176400 Hz → R ≈ 0.99929
// Recalculated per actual sample rate in constructor
const DC_BLOCK_FC = 20;

// ── Sag envelope follower defaults ───────────────────────────────────
const SAG_ATTACK_MS = 8;
const SAG_RELEASE_MS = 120;
const SAG_MAX_REDUCTION = 0.35; // max gain reduction from sag

// ── Waveshaping curve functions ──────────────────────────────────────

function cleanCurve(x, gain) {
  const amount = gain * 8 + 1;
  return Math.tanh(x * amount);
}

function crunchCurve(x, gain) {
  const amount = gain * 15 + 2;
  if (x >= 0) {
    return 1 - Math.exp(-amount * x);
  }
  return -(1 - Math.exp(amount * x * 0.5));
}

function highGainCurve(x, gain) {
  const amount = gain * 20 + 4;
  if (x >= 0) {
    return 1 - Math.exp(-amount * x);
  }
  return -(1 - Math.exp(amount * x * 0.7));
}

function highGainStage2Curve(x, gain) {
  const amount = gain * 8 + 2;
  return Math.tanh(x * amount) * 0.95;
}

function acousticCurve(x, gain) {
  const amount = gain * 3 + 1;
  return Math.tanh(x * amount);
}

// ── Processor ────────────────────────────────────────────────────────

class TubePreampProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    // Default amp type
    this._ampType = AMP_TYPE_CLEAN;
    this._hasCascade = false;

    // Anti-alias filter delay line (per channel not needed — mono input)
    this._aaDelayLine = new Float32Array(AA_FILTER_LENGTH);
    this._aaDelayIndex = 0;

    // DC block state (two stages: after stage 1 and after optional stage 2)
    const oversampledRate = sampleRate * OVERSAMPLE_FACTOR;
    const dcR = 1 - (2 * Math.PI * DC_BLOCK_FC) / oversampledRate;
    this._dcR = dcR;
    this._dcX1_a = 0;
    this._dcY1_a = 0;
    this._dcX1_b = 0;
    this._dcY1_b = 0;

    // Sag envelope follower state
    this._sagEnvelope = 0;
    this._sagAttackCoeff = 1 - Math.exp(-1 / (SAG_ATTACK_MS * 0.001 * sampleRate));
    this._sagReleaseCoeff = 1 - Math.exp(-1 / (SAG_RELEASE_MS * 0.001 * sampleRate));

    // Listen for amp type changes via MessagePort
    this.port.onmessage = (event) => {
      if (event.data.type === 'setAmpType') {
        this._ampType = event.data.ampType;
        this._hasCascade = this._ampType === AMP_TYPE_HIGHGAIN;
        // Reset DC block state on amp type change to avoid transients
        this._dcX1_a = 0;
        this._dcY1_a = 0;
        this._dcX1_b = 0;
        this._dcY1_b = 0;
        this._sagEnvelope = 0;
      }
    };

    // Set initial amp type from processor options
    if (options.processorOptions) {
      this._ampType = options.processorOptions.ampType ?? AMP_TYPE_CLEAN;
      this._hasCascade = this._ampType === AMP_TYPE_HIGHGAIN;
    }
  }

  static get parameterDescriptors() {
    return [
      { name: 'gain', defaultValue: 0.5, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'sagAmount', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    ];
  }

  /**
   * Apply the appropriate waveshaping curve for the current amp type.
   */
  _applyStage1(x, gain) {
    switch (this._ampType) {
      case AMP_TYPE_CLEAN:
        return cleanCurve(x, gain);
      case AMP_TYPE_CRUNCH:
        return crunchCurve(x, gain);
      case AMP_TYPE_HIGHGAIN:
        return highGainCurve(x, gain);
      case AMP_TYPE_ACOUSTIC:
        return acousticCurve(x, gain);
      default:
        return cleanCurve(x, gain);
    }
  }

  /**
   * Apply cascaded second stage (highgain only).
   */
  _applyStage2(x, gain) {
    return highGainStage2Curve(x, gain);
  }

  /**
   * One-pole DC block filter.
   * y[n] = x[n] - x[n-1] + R * y[n-1]
   * Returns [output, newX1, newY1]
   */
  _dcBlock(sample, x1, y1) {
    const y = sample - x1 + this._dcR * y1;
    return [y, sample, y];
  }

  /**
   * Sag envelope follower — tracks signal energy to modulate gain.
   * Heavy playing reduces available "voltage", softening attack and
   * compressing dynamics like a real tube amp power supply.
   */
  _updateSagEnvelope(sample) {
    const rectified = Math.abs(sample);
    if (rectified > this._sagEnvelope) {
      this._sagEnvelope += this._sagAttackCoeff * (rectified - this._sagEnvelope);
    } else {
      this._sagEnvelope += this._sagReleaseCoeff * (rectified - this._sagEnvelope);
    }
    return this._sagEnvelope;
  }

  /**
   * FIR anti-alias filter for downsampling from oversampled rate.
   */
  _antiAliasFilter(sample) {
    this._aaDelayLine[this._aaDelayIndex] = sample;

    let sum = 0;
    let idx = this._aaDelayIndex;
    for (let t = 0; t < AA_FILTER_LENGTH; t++) {
      sum += AA_FILTER_TAPS[t] * this._aaDelayLine[idx];
      idx--;
      if (idx < 0) idx = AA_FILTER_LENGTH - 1;
    }

    this._aaDelayIndex++;
    if (this._aaDelayIndex >= AA_FILTER_LENGTH) {
      this._aaDelayIndex = 0;
    }

    return sum;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    // No input connected — pass silence
    if (!input || !input[0] || input[0].length === 0) {
      for (let ch = 0; ch < output.length; ch++) {
        output[ch].fill(0);
      }
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    const blockSize = inputChannel.length;

    // Read k-rate parameters (one value per block)
    const gain = parameters.gain[0];
    const sagAmount = parameters.sagAmount[0];

    // Preamp boost for current amp type
    const boost = PREAMP_BOOST[this._ampType] ?? PREAMP_BOOST[AMP_TYPE_CLEAN];

    for (let i = 0; i < blockSize; i++) {
      const rawSample = inputChannel[i];

      // Sag envelope follower runs at base sample rate (pre-oversampling)
      const envelope = this._updateSagEnvelope(rawSample);

      // Sag modulates the effective gain — heavier signal = less headroom
      // sagAmount controls how much the sag affects the sound (0 = no sag)
      const sagGainReduction = 1 - sagAmount * SAG_MAX_REDUCTION * Math.min(envelope * 4, 1);

      // Apply preamp boost with sag modulation
      const boosted = rawSample * (boost * gain + 1) * sagGainReduction;

      // 4x oversample: process each oversampled sample through waveshaper
      // Simple zero-stuffing upsample → waveshape → anti-alias filter → decimate
      let lastFiltered = 0;
      for (let os = 0; os < OVERSAMPLE_FACTOR; os++) {
        // Zero-stuffing upsampler: only first sample has the value,
        // rest are zero (scaled by oversample factor for energy preservation)
        const upsampled = os === 0 ? boosted * OVERSAMPLE_FACTOR : 0;

        // Stage 1 waveshaping
        let shaped = this._applyStage1(upsampled, gain);

        // DC block after stage 1
        let dcResult = this._dcBlock(shaped, this._dcX1_a, this._dcY1_a);
        shaped = dcResult[0];
        this._dcX1_a = dcResult[1];
        this._dcY1_a = dcResult[2];

        // Optional cascaded stage 2 (highgain only)
        if (this._hasCascade) {
          shaped = this._applyStage2(shaped, gain);

          // DC block after stage 2
          dcResult = this._dcBlock(shaped, this._dcX1_b, this._dcY1_b);
          shaped = dcResult[0];
          this._dcX1_b = dcResult[1];
          this._dcY1_b = dcResult[2];
        }

        // Anti-alias filter
        lastFiltered = this._antiAliasFilter(shaped);
      }

      // Decimate: take the last filtered sample
      // Sag also slightly softens the overall output (compression effect)
      outputChannel[i] = lastFiltered * sagGainReduction;
    }

    // Copy mono output to all channels if stereo output
    for (let ch = 1; ch < output.length; ch++) {
      output[ch].set(outputChannel);
    }

    return true;
  }
}

registerProcessor('tube-preamp-processor', TubePreampProcessor);
