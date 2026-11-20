import { EffectNode } from '@/lib/audio/effectNode';
import { CHORUS_DEFINITION } from '@/lib/constants/effects';

// Size of the delay line — longest base delay (0.05 s) plus the deepest modulation, with headroom
const MAX_DELAY_SECONDS = 0.1;
// Peak LFO swing of the delay time at full depth
const MAX_MODULATION_SECONDS = 0.01;

/**
 * Chorus: a short delay line whose delay time is swept by a sine LFO,
 * blended with the dry signal.
 */
export class ChorusEffect extends EffectNode {
  private delayNode: DelayNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private depth: number;
  private baseDelay: number;

  constructor(context: AudioContext) {
    super(context);

    // Placeholders until applyDefaults() below sets the real values
    this.depth = 0;
    this.baseDelay = 0;

    this.delayNode = context.createDelay(MAX_DELAY_SECONDS);

    this.lfo = context.createOscillator();
    this.lfo.type = 'sine';

    this.lfoGain = context.createGain();

    // LFO modulates delay time
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delayNode.delayTime);
    this.lfo.start();

    // Wet: input → delay → wetNode
    this.inputNode.connect(this.delayNode);
    this.delayNode.connect(this.wetNode);

    this.applyDefaults(CHORUS_DEFINITION);
  }

  private updateModulation(): void {
    // The swing may never exceed the base delay: the LFO trough would otherwise
    // ask for a negative delay time, which the browser clamps to zero —
    // flattening the bottom of the sweep.
    const maxSwing = Math.min(MAX_MODULATION_SECONDS, this.baseDelay);
    this.setParam(this.lfoGain.gain, this.depth * maxSwing);
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'rate':
        this.setParam(this.lfo.frequency, value);
        break;
      case 'depth':
        this.depth = value;
        this.updateModulation();
        break;
      case 'mix':
        this.setMix(value);
        break;
      case 'delay':
        this.baseDelay = value;
        this.setParam(this.delayNode.delayTime, value);
        this.updateModulation();
        break;
    }
  }

  dispose(): void {
    this.lfo.stop();
    this.lfo.disconnect();
    this.lfoGain.disconnect();
    this.delayNode.disconnect();
    this.disposeBase();
  }
}
