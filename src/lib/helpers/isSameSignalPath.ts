import type { EffectParameterValue, PedalboardSignalPath } from '@/types/audio';

function hasSameParameters(
  a: readonly EffectParameterValue[],
  b: readonly EffectParameterValue[],
): boolean {
  if (a === b) return true;
  return a.length === b.length && a.every((parameter, index) => (
    parameter.id === b[index].id && parameter.value === b[index].value
  ));
}

/**
 * Whether two signal paths produce the same sound: the same amp with the same settings and
 * the same effects, in the same order, with the same settings and bypass states.
 *
 * Compared by value rather than by reference, because a board restored from localStorage
 * never shares objects with the preset it was loaded from. Effect ids are ignored — they
 * identify pedals, not sounds.
 * @param a - One signal path, e.g. the current board
 * @param b - The other signal path, e.g. a preset's board
 * @returns True when nothing audible differs between the two
 */
export function isSameSignalPath(a: PedalboardSignalPath, b: PedalboardSignalPath): boolean {
  if (a.ampType !== b.ampType || !hasSameParameters(a.ampParameters, b.ampParameters)) return false;
  if (a.effects === b.effects) return true;

  return a.effects.length === b.effects.length && a.effects.every((effect, index) => {
    const other = b.effects[index];
    return (
      effect.type === other.type &&
      effect.isBypassed === other.isBypassed &&
      hasSameParameters(effect.parameters, other.parameters)
    );
  });
}
