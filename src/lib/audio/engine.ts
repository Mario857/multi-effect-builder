import { SignalChain } from '@/lib/audio/signalChain';
import { preloadAllCabIRs } from '@/lib/audio/cabImpulseResponse';
import { FFT_SIZE, SMOOTHING_TIME_CONSTANT, TUBE_PREAMP_WORKLET_PATH } from '@/lib/constants/audio';

/**
 * Core audio engine managing Web Audio API context, input stream,
 * signal chain, and output metering.
 */
export class AudioEngine {
  private context: AudioContext | null;
  private inputStream: MediaStream | null;
  private inputSourceNode: MediaStreamAudioSourceNode | null;
  private inputGainNode: GainNode | null;
  private masterGainNode: GainNode | null;
  private inputAnalyser: AnalyserNode | null;
  private outputAnalyser: AnalyserNode | null;
  private ampChain: SignalChain | null;
  private effectChain: SignalChain | null;
  private _isRunning: boolean;

  constructor() {
    this.context = null;
    this.inputStream = null;
    this.inputSourceNode = null;
    this.inputGainNode = null;
    this.masterGainNode = null;
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    this.ampChain = null;
    this.effectChain = null;
    this._isRunning = false;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get audioContext(): AudioContext | null {
    return this.context;
  }

  get ampSignalChain(): SignalChain | null {
    return this.ampChain;
  }

  get effectSignalChain(): SignalChain | null {
    return this.effectChain;
  }

  async start(): Promise<void> {
    if (this._isRunning) return;

    this.context = new AudioContext({ latencyHint: 'interactive' });

    // Register AudioWorklet modules and preload cabinet IRs in parallel
    // Both must complete before creating any amp nodes
    await Promise.all([
      this.context.audioWorklet.addModule(TUBE_PREAMP_WORKLET_PATH),
      preloadAllCabIRs(this.context),
    ]);

    // Force mono input — Focusrite and other interfaces present as stereo
    // but guitar is on one channel only; downmix prevents one-sided output
    this.inputGainNode = this.context.createGain();
    this.inputGainNode.channelCount = 1;
    this.inputGainNode.channelCountMode = 'explicit';

    // Force stereo output — upmix mono chain to both speakers equally
    this.masterGainNode = this.context.createGain();
    this.masterGainNode.channelCount = 2;
    this.masterGainNode.channelCountMode = 'explicit';

    this.inputAnalyser = this.context.createAnalyser();
    this.inputAnalyser.fftSize = FFT_SIZE;
    this.inputAnalyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;

    this.outputAnalyser = this.context.createAnalyser();
    this.outputAnalyser.fftSize = FFT_SIZE;
    this.outputAnalyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;

    this.ampChain = new SignalChain(this.context);
    this.effectChain = new SignalChain(this.context);

    // Signal path: inputGain → inputAnalyser → ampChain → effectChain → masterGain → outputAnalyser → destination
    this.inputGainNode.connect(this.inputAnalyser);
    this.inputAnalyser.connect(this.ampChain.input);
    this.ampChain.output.connect(this.effectChain.input);
    this.effectChain.output.connect(this.masterGainNode);
    this.masterGainNode.connect(this.outputAnalyser);
    this.outputAnalyser.connect(this.context.destination);

    this._isRunning = true;
  }

  async connectInput(deviceId?: string): Promise<void> {
    if (!this.context || !this.inputGainNode) return;

    // Disconnect existing input
    if (this.inputSourceNode) {
      this.inputSourceNode.disconnect();
      this.inputSourceNode = null;
    }
    if (this.inputStream) {
      this.inputStream.getTracks().forEach((track) => track.stop());
      this.inputStream = null;
    }

    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      },
      video: false,
    };

    this.inputStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.inputSourceNode = this.context.createMediaStreamSource(this.inputStream);
    this.inputSourceNode.connect(this.inputGainNode);

    // Resume context if suspended (browser autoplay policy)
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  setMasterVolume(volume: number): void {
    if (!this.masterGainNode || !this.context) return;
    this.masterGainNode.gain.linearRampToValueAtTime(
      volume,
      this.context.currentTime + 0.02,
    );
  }

  getInputLevel(): number {
    return this.getAnalyserLevel(this.inputAnalyser);
  }

  getOutputLevel(): number {
    return this.getAnalyserLevel(this.outputAnalyser);
  }

  getInputAnalyser(): AnalyserNode | null {
    return this.inputAnalyser;
  }

  getOutputAnalyser(): AnalyserNode | null {
    return this.outputAnalyser;
  }

  private getAnalyserLevel(analyser: AnalyserNode | null): number {
    if (!analyser) return 0;
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  async stop(): Promise<void> {
    if (this.inputSourceNode) {
      this.inputSourceNode.disconnect();
      this.inputSourceNode = null;
    }
    if (this.inputStream) {
      this.inputStream.getTracks().forEach((track) => track.stop());
      this.inputStream = null;
    }
    if (this.ampChain) {
      this.ampChain.dispose();
      this.ampChain = null;
    }
    if (this.effectChain) {
      this.effectChain.dispose();
      this.effectChain = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    this.inputGainNode = null;
    this.masterGainNode = null;
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    this._isRunning = false;
  }
}
