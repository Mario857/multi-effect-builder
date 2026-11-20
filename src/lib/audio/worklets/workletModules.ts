/**
 * Public paths of every AudioWorklet processor module the engine must register
 * (via `audioWorklet.addModule`) before any effect node is constructed.
 * Add new processor modules here — the engine loads all of them on start.
 */
export const WORKLET_MODULE_PATHS: readonly string[] = [
  '/worklets/tube-preamp-processor.js',
];
