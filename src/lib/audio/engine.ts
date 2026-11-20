import type { PedalboardSignalPath } from '@/types/audio';
import { SignalChain } from '@/lib/audio/signalChain';
import { PedalboardGraphSync } from '@/lib/audio/pedalboardGraphSync';
import { preloadAllCabIRs } from '@/lib/audio/cabImpulseResponse';
import { WORKLET_MODULE_PATHS } from '@/lib/audio/worklets/workletModules';
import {
  ANALYSER_WINDOW_SECONDS,
  GAIN_SILENT,
  GAIN_SMOOTHING_TIME_CONSTANT_SECONDS,
  GAIN_UNITY,
  INPUT_TRACK_CONSTRAINTS,
  MISSING_INPUT_DEVICE_ERROR_NAMES,
  SMOOTHING_TIME_CONSTANT,
} from '@/lib/constants/audio';
import { computeRms } from '@/lib/helpers/computeRms';
import { isRecord } from '@/lib/helpers/isRecord';

interface Graph {
  readonly inputGain: GainNode;
  readonly inputAnalyser: AnalyserNode;
  readonly chain: SignalChain;
  readonly pedalboardSync: PedalboardGraphSync;
  readonly masterGain: GainNode;
  readonly outputAnalyser: AnalyserNode;
  readonly monitorGain: GainNode;
  // One scratch buffer for all level measurements — the meters read ~40 times per second
  readonly meterBuffer: Float32Array<ArrayBuffer>;
}

/** Smallest power-of-two analyser size that spans the analysis window at this sample rate. */
function getAnalyserFftSize(sampleRate: number): number {
  return 2 ** Math.ceil(Math.log2(sampleRate * ANALYSER_WINDOW_SECONDS));
}

function createAnalyser(context: AudioContext): AnalyserNode {
  const analyser = context.createAnalyser();
  analyser.fftSize = getAnalyserFftSize(context.sampleRate);
  analyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;
  return analyser;
}

function buildGraph(context: AudioContext): Graph {
  // Force mono input — Focusrite and other interfaces present as stereo
  // but guitar is on one channel only; downmix prevents one-sided output
  const inputGain = context.createGain();
  inputGain.channelCount = 1;
  inputGain.channelCountMode = 'explicit';

  // Force stereo output — upmix mono chain to both speakers equally
  const masterGain = context.createGain();
  masterGain.channelCount = 2;
  masterGain.channelCountMode = 'explicit';

  const inputAnalyser = createAnalyser(context);
  const outputAnalyser = createAnalyser(context);
  const monitorGain = context.createGain();
  const chain = new SignalChain(context);

  // Signal path: inputGain → inputAnalyser → chain (amp → effects) → masterGain → outputAnalyser → monitorGain → destination
  // The monitor mute sits after the output analyser so the output meter keeps working while muted
  inputGain.connect(inputAnalyser);
  inputAnalyser.connect(chain.input);
  chain.output.connect(masterGain);
  masterGain.connect(outputAnalyser);
  outputAnalyser.connect(monitorGain);
  monitorGain.connect(context.destination);

  return {
    inputGain,
    inputAnalyser,
    chain,
    pedalboardSync: new PedalboardGraphSync(context, chain),
    masterGain,
    outputAnalyser,
    monitorGain,
    meterBuffer: new Float32Array(inputAnalyser.fftSize),
  };
}

function isMissingDeviceError(error: unknown): boolean {
  return (
    isRecord(error)
    && typeof error.name === 'string'
    && MISSING_INPUT_DEVICE_ERROR_NAMES.includes(error.name)
  );
}

async function openInputStream(deviceId: string | undefined): Promise<MediaStream> {
  const { mediaDevices } = navigator;
  if (!deviceId) return mediaDevices.getUserMedia({ audio: INPUT_TRACK_CONSTRAINTS });

  try {
    return await mediaDevices.getUserMedia({
      audio: { ...INPUT_TRACK_CONSTRAINTS, deviceId: { exact: deviceId } },
    });
  } catch (error) {
    // The requested device is gone (unplugged, or an id from an earlier session) —
    // fall back to the system default instead of failing with no input at all
    if (!isMissingDeviceError(error)) throw error;
    return mediaDevices.getUserMedia({ audio: INPUT_TRACK_CONSTRAINTS });
  }
}

function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Core audio engine managing Web Audio API context, input stream,
 * signal chain, and output metering.
 *
 * An instance is single-use: start() once, stop() once. Create a new
 * instance to start again.
 */
export class AudioEngine {
  private readonly onInputEnded: () => void;
  private context: AudioContext | null;
  private graph: Graph | null;
  private inputStream: MediaStream | null;
  private inputSource: MediaStreamAudioSourceNode | null;
  // Bumped by every connectInput() and by stop() — a request holding an older id is stale
  private inputRequestId: number;

  /**
   * @param onInputEnded - Called when the connected input device stops delivering audio (e.g. unplugged)
   */
  constructor(onInputEnded: () => void) {
    this.onInputEnded = onInputEnded;
    this.context = null;
    this.graph = null;
    this.inputStream = null;
    this.inputSource = null;
    this.inputRequestId = 0;
  }

  /** Whether the graph is built and the engine has not been stopped. */
  get isRunning(): boolean {
    return this.graph !== null;
  }

  /** Device id of the input that is actually connected, or null when there is none. */
  get inputDeviceId(): string | null {
    return this.inputTrack?.getSettings().deviceId ?? null;
  }

  /** Whether an input is connected and its device is still delivering audio. */
  get hasLiveInput(): boolean {
    return this.inputTrack?.readyState === 'live';
  }

  private get inputTrack(): MediaStreamTrack | undefined {
    return this.inputStream?.getAudioTracks()[0];
  }

  /**
   * Creates the AudioContext, loads the worklet modules and cab IRs and builds the graph.
   * If this rejects the engine is unusable — call stop() to release the context.
   * If stop() is called while loading, this resolves without building anything.
   */
  async start(): Promise<void> {
    if (this.context !== null) return;

    const context = new AudioContext({ latencyHint: 'interactive' });
    this.context = context;

    // Register AudioWorklet modules and preload cabinet IRs in parallel
    // Both must complete before creating any amp nodes
    const { audioWorklet } = context;
    await Promise.all([
      ...WORKLET_MODULE_PATHS.map((path) => audioWorklet.addModule(path)),
      preloadAllCabIRs(context),
    ]);

    // stop() ran while the modules were loading — the context is closed, nothing to build
    if (this.context !== context) return;

    this.graph = buildGraph(context);
  }

  /**
   * Opens an input device and routes it into the graph, replacing the current input.
   * Overlapping calls are resolved as "latest wins": only the most recent request is
   * connected, and a stream opened for a superseded request is released again. This
   * keeps two rapid calls from leaving two live microphones summed into the input.
   * A device that no longer exists falls back to the system default input.
   * @param deviceId - The device to open; omit (or pass '') for the system default
   * @returns true if this request ended up connected, false if it was superseded or the engine stopped
   */
  async connectInput(deviceId?: string): Promise<boolean> {
    const requestId = ++this.inputRequestId;
    const isStale = () => requestId !== this.inputRequestId;

    let stream: MediaStream;
    try {
      stream = await openInputStream(deviceId);
    } catch (error) {
      // The failure of a superseded request is irrelevant to the caller of the current one
      if (isStale()) return false;
      throw error;
    }

    const { context, graph } = this;
    if (isStale() || context === null || graph === null) {
      stopStream(stream);
      return false;
    }

    // The previous input stays connected until the new one is ready, so switching has no silent gap
    this.releaseInput();
    this.inputStream = stream;
    this.inputSource = context.createMediaStreamSource(stream);
    this.inputSource.connect(graph.inputGain);
    stream.getAudioTracks().forEach((track) => track.addEventListener('ended', this.onInputEnded));

    // Resume context if suspended (browser autoplay policy)
    if (context.state === 'suspended') {
      await context.resume();
    }
    return true;
  }

  /**
   * Brings the amp and effect nodes in line with the pedalboard.
   * @param signalPath - The desired amp and ordered effect chain
   */
  syncPedalboard(signalPath: PedalboardSignalPath): void {
    this.graph?.pedalboardSync.sync(signalPath);
  }

  /**
   * Sets the output volume.
   * @param volume - Linear gain, 0..1
   */
  setMasterVolume(volume: number): void {
    this.smoothGain(this.graph?.masterGain, volume);
  }

  /**
   * Switches the speaker output on or off. The signal is muted after the output
   * analyser, so levels (and the tuner) keep working while monitoring is off.
   * @param isMonitoring - Whether the processed signal should reach the speakers
   */
  setMonitoring(isMonitoring: boolean): void {
    this.smoothGain(this.graph?.monitorGain, isMonitoring ? GAIN_UNITY : GAIN_SILENT);
  }

  /** RMS level (linear, 0..1) of the dry input signal. */
  getInputLevel(): number {
    return this.measureLevel(this.graph?.inputAnalyser);
  }

  /** RMS level (linear, 0..1) of the processed signal after the master volume. */
  getOutputLevel(): number {
    return this.measureLevel(this.graph?.outputAnalyser);
  }

  /** Analyser on the dry input signal (used by the tuner), or null while not running. */
  getInputAnalyser(): AnalyserNode | null {
    return this.graph?.inputAnalyser ?? null;
  }

  /**
   * Releases the microphone, disposes all effect nodes and closes the AudioContext.
   * Safe to call at any point, including while start() or connectInput() is pending.
   */
  async stop(): Promise<void> {
    const { context, graph } = this;
    this.context = null;
    this.graph = null;
    // Invalidates any connectInput() still waiting for its stream
    this.inputRequestId++;

    this.releaseInput();
    if (graph !== null) {
      graph.pedalboardSync.dispose();
      graph.chain.dispose();
    }
    if (context !== null && context.state !== 'closed') {
      await context.close();
    }
  }

  private releaseInput(): void {
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    if (this.inputStream) {
      this.inputStream.getAudioTracks().forEach((track) => track.removeEventListener('ended', this.onInputEnded));
      stopStream(this.inputStream);
      this.inputStream = null;
    }
  }

  private smoothGain(gainNode: GainNode | undefined, target: number): void {
    if (!gainNode || !this.context) return;
    // setTargetAtTime glides from whatever the value is at "now", so it needs no anchor
    // event. A bare linearRamp would start from the previous automation event, which
    // after idle time lies in the past — the gain would jump to the target with a click.
    gainNode.gain.setTargetAtTime(target, this.context.currentTime, GAIN_SMOOTHING_TIME_CONSTANT_SECONDS);
  }

  private measureLevel(analyser: AnalyserNode | undefined): number {
    if (!analyser || !this.graph) return 0;
    const { meterBuffer } = this.graph;
    analyser.getFloatTimeDomainData(meterBuffer);
    return computeRms(meterBuffer);
  }
}
