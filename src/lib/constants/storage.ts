/** localStorage key of the persisted pedalboard (board, user presets, active preset). */
export const PEDALBOARD_STORAGE_KEY = 'multi-effect-pedalboard';

/**
 * Schema version of the persisted pedalboard.
 * 0 (implicit) stored the whole store state including factory presets;
 * 1 stores only the board, the user presets and the active preset id.
 */
export const PEDALBOARD_STORAGE_VERSION = 1;

/** Minimum time between two localStorage writes while the board is being edited. */
export const STORAGE_WRITE_THROTTLE_MS = 500;
