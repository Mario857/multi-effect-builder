/**
 * Tube Preamp AudioWorklet Processor
 *
 * Sample-by-sample DSP running in a dedicated audio thread.
 * Features:
 *   - Per-amp-type preamp waveshaping curves (clean, crunch, highgain, acoustic)
 *   - Optional cascaded second preamp stage (highgain only)
 *   - Power amp stage with soft symmetrical clipping
 *   - Output transformer bandwidth coloring
 *   - Power supply sag via RC envelope follower
 *   - DC blocking after each nonlinear stage
 */

// ── Amp type indices (must match tubePreampConstants.ts) ──────────────
const AMP_TYPE_CLEAN = 0;
const AMP_TYPE_CRUNCH = 1;
const AMP_TYPE_HIGHGAIN = 2;
const AMP_TYPE_ACOUSTIC = 3;

// ── Preamp boost per amp type ────────────────────────────────────────
const PREAMP_BOOST = [
  8,  // clean
  6,  // crunch
  8,  // highgain
  8,  // acoustic
];

// ── Power amp drive per amp type ─────────────────────────────────────
// Controls how hard the signal hits the power amp clipping stage.
// Clean/acoustic barely clip; crunch/highgain push harder.
const POWER_AMP_DRIVE = [
  1.2,  // clean — stays mostly linear
  1.6,  // crunch — gentle power tube saturation
  2.0,  // highgain — noticeable power amp compression
  1.0,  // acoustic — transparent, no power amp color
];

// ── Output transformer bandwidth ─────────────────────────────────────
// Real output transformers roll off extreme lows and highs.
const OT_LOWPASS_FC = [
  6500, // clean — bright transformer
  5500, // crunch — warm transformer
  5000, // highgain — dark, focused
  8000, // acoustic — wide bandwidth
];
const OT_HIGHPASS_FC = [
  60,  // clean
  70,  // crunch
  80,  // highgain — tight bottom
  50,  // acoustic
];

// ── DC block one-pole highpass ────────────────────────────────────────
const DC_BLOCK_FC = 20;

// ── Sag envelope follower ────────────────────────────────────────────
const SAG_ATTACK_MS = 8;
const SAG_RELEASE_MS = 120;
const SAG_MAX_REDUCTION = 0.35;

// ── Preamp waveshaping curve functions ───────────────────────────────

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

/**
 * Power amp stage — soft symmetrical clipping.
 * Real power tubes (6L6, EL34) clip more symmetrically than preamp tubes,
 * producing even-order harmonics that sound warm and musical.
 */
function powerAmpCurve(x, drive) {
  const driven = x * drive;
  // Soft cubic clipping with smooth knee
  if (driven > 1) return 1;
  if (driven < -1) return -1;
  return driven - (driven * driven * driven) / 3;
}

// ── Processor ────────────────────────────────────────────────────────

class TubePreampProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    this._ampType = AMP_TYPE_CLEAN;
    this._hasCascade = false;

    // DC block state — one per nonlinear stage (preamp1, preamp2, poweramp)
    this._dcR = 1 - (2 * Math.PI * DC_BLOCK_FC) / sampleRate;
    this._dcX1_a = 0; this._dcY1_a = 0;
    this._dcX1_b = 0; this._dcY1_b = 0;
    this._dcX1_c = 0; this._dcY1_c = 0;

    // Output transformer filters (one-pole LP + HP)
    this._otLpState = 0;
    this._otHpX1 = 0;
    this._otHpY1 = 0;
    this._updateOTCoefficients();

    // Sag envelope follower
    this._sagEnvelope = 0;
    this._sagAttackCoeff = 1 - Math.exp(-1 / (SAG_ATTACK_MS * 0.001 * sampleRate));
    this._sagReleaseCoeff = 1 - Math.exp(-1 / (SAG_RELEASE_MS * 0.001 * sampleRate));

    this.port.onmessage = (event) => {
      if (event.data.type === 'setAmpType') {
        this._ampType = event.data.ampType;
        this._hasCascade = this._ampType === AMP_TYPE_HIGHGAIN;
        this._resetState();
        this._updateOTCoefficients();
      }
    };

    if (options.processorOptions) {
      this._ampType = options.processorOptions.ampType ?? AMP_TYPE_CLEAN;
      this._hasCascade = this._ampType === AMP_TYPE_HIGHGAIN;
      this._updateOTCoefficients();
    }
  }

  _resetState() {
    this._dcX1_a = 0; this._dcY1_a = 0;
    this._dcX1_b = 0; this._dcY1_b = 0;
    this._dcX1_c = 0; this._dcY1_c = 0;
    this._otLpState = 0;
    this._otHpX1 = 0;
    this._otHpY1 = 0;
    this._sagEnvelope = 0;
  }

  _updateOTCoefficients() {
    const lpFc = OT_LOWPASS_FC[this._ampType] ?? OT_LOWPASS_FC[AMP_TYPE_CLEAN];
    const hpFc = OT_HIGHPASS_FC[this._ampType] ?? OT_HIGHPASS_FC[AMP_TYPE_CLEAN];
    this._otLpCoeff = 1 - Math.exp(-2 * Math.PI * lpFc / sampleRate);
    this._otHpR = 1 - (2 * Math.PI * hpFc) / sampleRate;
  }

  static get parameterDescriptors() {
    return [
      { name: 'gain', defaultValue: 0.5, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'sagAmount', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    ];
  }

  _applyStage1(x, gain) {
    switch (this._ampType) {
      case AMP_TYPE_CLEAN:    return cleanCurve(x, gain);
      case AMP_TYPE_CRUNCH:   return crunchCurve(x, gain);
      case AMP_TYPE_HIGHGAIN: return highGainCurve(x, gain);
      case AMP_TYPE_ACOUSTIC: return acousticCurve(x, gain);
      default:                return cleanCurve(x, gain);
    }
  }

  _applyStage2(x, gain) {
    return highGainStage2Curve(x, gain);
  }

  /** One-pole DC block: y[n] = x[n] - x[n-1] + R * y[n-1] */
  _dcBlock(sample, x1, y1) {
    const y = sample - x1 + this._dcR * y1;
    return [y, sample, y];
  }

  _updateSagEnvelope(sample) {
    const rectified = Math.abs(sample);
    if (rectified > this._sagEnvelope) {
      this._sagEnvelope += this._sagAttackCoeff * (rectified - this._sagEnvelope);
    } else {
      this._sagEnvelope += this._sagReleaseCoeff * (rectified - this._sagEnvelope);
    }
    return this._sagEnvelope;
  }

  /** Output transformer bandwidth — lowpass + highpass */
  _applyOutputTransformer(sample) {
    this._otLpState += this._otLpCoeff * (sample - this._otLpState);
    const hpOut = this._otLpState - this._otHpX1 + this._otHpR * this._otHpY1;
    this._otHpX1 = this._otLpState;
    this._otHpY1 = hpOut;
    return hpOut;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || input[0].length === 0) {
      for (let ch = 0; ch < output.length; ch++) {
        output[ch].fill(0);
      }
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    const blockSize = inputChannel.length;

    const gain = parameters.gain[0];
    const sagAmount = parameters.sagAmount[0];

    const boost = PREAMP_BOOST[this._ampType] ?? PREAMP_BOOST[AMP_TYPE_CLEAN];
    const powerDrive = POWER_AMP_DRIVE[this._ampType] ?? POWER_AMP_DRIVE[AMP_TYPE_CLEAN];

    for (let i = 0; i < blockSize; i++) {
      const rawSample = inputChannel[i];

      // Sag envelope follower
      const envelope = this._updateSagEnvelope(rawSample);
      const sagGainReduction = 1 - sagAmount * SAG_MAX_REDUCTION * Math.min(envelope * 4, 1);

      // Preamp boost with sag modulation
      let sample = rawSample * (boost * gain + 1) * sagGainReduction;

      // Preamp stage 1 — asymmetric tube clipping
      sample = this._applyStage1(sample, gain);

      let dcResult = this._dcBlock(sample, this._dcX1_a, this._dcY1_a);
      sample = dcResult[0];
      this._dcX1_a = dcResult[1];
      this._dcY1_a = dcResult[2];

      // Optional cascaded preamp stage 2 (highgain only)
      if (this._hasCascade) {
        sample = this._applyStage2(sample, gain);

        dcResult = this._dcBlock(sample, this._dcX1_b, this._dcY1_b);
        sample = dcResult[0];
        this._dcX1_b = dcResult[1];
        this._dcY1_b = dcResult[2];
      }

      // Power amp stage — soft symmetrical clipping
      // Sag reduces power amp headroom too
      sample = powerAmpCurve(sample, powerDrive * sagGainReduction);

      // DC block after power amp
      dcResult = this._dcBlock(sample, this._dcX1_c, this._dcY1_c);
      sample = dcResult[0];
      this._dcX1_c = dcResult[1];
      this._dcY1_c = dcResult[2];

      // Output transformer bandwidth coloring
      sample = this._applyOutputTransformer(sample);

      outputChannel[i] = sample;
    }

    // Copy mono to all output channels
    for (let ch = 1; ch < output.length; ch++) {
      output[ch].set(outputChannel);
    }

    return true;
  }
}

registerProcessor('tube-preamp-processor', TubePreampProcessor);
