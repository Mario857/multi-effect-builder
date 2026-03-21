import type { Preset } from '@/types/audio';
import { EFFECT_TYPE } from '@/types/audio';

/**
 * Factory presets showcasing different guitar tones.
 * Each is marked isFactory: true so users cannot delete them.
 */
export const FACTORY_PRESETS: readonly Preset[] = [
  {
    id: 'factory-clean-sparkle',
    name: 'Clean Sparkle',
    isFactory: true,
    pedalboard: {
      id: 'pb-clean-sparkle',
      name: 'Clean Sparkle',
      ampType: EFFECT_TYPE.AMP_CLEAN,
      ampParameters: [
        { id: 'gain', value: 0.35 },
        { id: 'bass', value: -2 },
        { id: 'mid', value: 1 },
        { id: 'treble', value: 3 },
        { id: 'presence', value: 2 },
        { id: 'master', value: 0.7 },
      ],
      effects: [
        {
          id: 'fx-cs-comp',
          type: EFFECT_TYPE.COMPRESSOR,
          isBypassed: false,
          parameters: [
            { id: 'threshold', value: -18 },
            { id: 'ratio', value: 3 },
            { id: 'attack', value: 0.01 },
            { id: 'release', value: 0.15 },
            { id: 'knee', value: 12 },
          ],
        },
        {
          id: 'fx-cs-chorus',
          type: EFFECT_TYPE.CHORUS,
          isBypassed: false,
          parameters: [
            { id: 'rate', value: 0.8 },
            { id: 'depth', value: 0.3 },
            { id: 'mix', value: 0.4 },
            { id: 'delay', value: 0.012 },
          ],
        },
        {
          id: 'fx-cs-reverb',
          type: EFFECT_TYPE.REVERB,
          isBypassed: false,
          parameters: [
            { id: 'decay', value: 2.5 },
            { id: 'size', value: 0.5 },
            { id: 'mix', value: 0.4 },
            { id: 'damping', value: 0.5 },
          ],
        },
      ],
    },
  },
  {
    id: 'factory-blues-crunch',
    name: 'Blues Crunch',
    isFactory: true,
    pedalboard: {
      id: 'pb-blues-crunch',
      name: 'Blues Crunch',
      ampType: EFFECT_TYPE.AMP_CRUNCH,
      ampParameters: [
        { id: 'gain', value: 0.55 },
        { id: 'bass', value: 1 },
        { id: 'mid', value: 3 },
        { id: 'treble', value: 1.5 },
        { id: 'presence', value: 1 },
        { id: 'master', value: 0.65 },
      ],
      effects: [
        {
          id: 'fx-bc-dist',
          type: EFFECT_TYPE.DISTORTION,
          isBypassed: false,
          parameters: [
            { id: 'drive', value: 0.35 },
            { id: 'tone', value: 3500 },
            { id: 'level', value: 0.6 },
            { id: 'mix', value: 0.8 },
          ],
        },
        {
          id: 'fx-bc-delay',
          type: EFFECT_TYPE.DELAY,
          isBypassed: false,
          parameters: [
            { id: 'time', value: 0.35 },
            { id: 'feedback', value: 0.3 },
            { id: 'mix', value: 0.3 },
            { id: 'tone', value: 3000 },
          ],
        },
        {
          id: 'fx-bc-reverb',
          type: EFFECT_TYPE.REVERB,
          isBypassed: false,
          parameters: [
            { id: 'decay', value: 2.2 },
            { id: 'size', value: 0.45 },
            { id: 'mix', value: 0.35 },
            { id: 'damping', value: 0.5 },
          ],
        },
      ],
    },
  },
  {
    id: 'factory-heavy-metal',
    name: 'Heavy Metal',
    isFactory: true,
    pedalboard: {
      id: 'pb-heavy-metal',
      name: 'Heavy Metal',
      ampType: EFFECT_TYPE.AMP_HIGHGAIN,
      ampParameters: [
        { id: 'gain', value: 0.75 },
        { id: 'bass', value: 2 },
        { id: 'mid', value: -1 },
        { id: 'treble', value: 2 },
        { id: 'presence', value: 1.5 },
        { id: 'master', value: 0.7 },
      ],
      effects: [
        {
          id: 'fx-hm-gate',
          type: EFFECT_TYPE.NOISE_GATE,
          isBypassed: false,
          parameters: [
            { id: 'threshold', value: -40 },
            { id: 'attack', value: 0.002 },
            { id: 'release', value: 0.05 },
          ],
        },
        {
          id: 'fx-hm-eq',
          type: EFFECT_TYPE.EQ,
          isBypassed: false,
          parameters: [
            { id: 'lowGain', value: 2 },
            { id: 'lowFreq', value: 100 },
            { id: 'midGain', value: -2 },
            { id: 'midFreq', value: 800 },
            { id: 'highGain', value: 1.5 },
            { id: 'highFreq', value: 4000 },
          ],
        },
        {
          id: 'fx-hm-reverb',
          type: EFFECT_TYPE.REVERB,
          isBypassed: false,
          parameters: [
            { id: 'decay', value: 1.5 },
            { id: 'size', value: 0.35 },
            { id: 'mix', value: 0.2 },
            { id: 'damping', value: 0.6 },
          ],
        },
      ],
    },
  },
  {
    id: 'factory-ambient-wash',
    name: 'Ambient Wash',
    isFactory: true,
    pedalboard: {
      id: 'pb-ambient-wash',
      name: 'Ambient Wash',
      ampType: EFFECT_TYPE.AMP_CLEAN,
      ampParameters: [
        { id: 'gain', value: 0.25 },
        { id: 'bass', value: -1 },
        { id: 'mid', value: 0 },
        { id: 'treble', value: 2 },
        { id: 'presence', value: 3 },
        { id: 'master', value: 0.7 },
      ],
      effects: [
        {
          id: 'fx-aw-comp',
          type: EFFECT_TYPE.COMPRESSOR,
          isBypassed: false,
          parameters: [
            { id: 'threshold', value: -20 },
            { id: 'ratio', value: 4 },
            { id: 'attack', value: 0.015 },
            { id: 'release', value: 0.3 },
            { id: 'knee', value: 15 },
          ],
        },
        {
          id: 'fx-aw-chorus',
          type: EFFECT_TYPE.CHORUS,
          isBypassed: false,
          parameters: [
            { id: 'rate', value: 0.4 },
            { id: 'depth', value: 0.6 },
            { id: 'mix', value: 0.5 },
            { id: 'delay', value: 0.015 },
          ],
        },
        {
          id: 'fx-aw-delay',
          type: EFFECT_TYPE.DELAY,
          isBypassed: false,
          parameters: [
            { id: 'time', value: 0.6 },
            { id: 'feedback', value: 0.55 },
            { id: 'mix', value: 0.5 },
            { id: 'tone', value: 2500 },
          ],
        },
        {
          id: 'fx-aw-reverb',
          type: EFFECT_TYPE.REVERB,
          isBypassed: false,
          parameters: [
            { id: 'decay', value: 6.0 },
            { id: 'size', value: 0.8 },
            { id: 'mix', value: 0.6 },
            { id: 'damping', value: 0.35 },
          ],
        },
      ],
    },
  },
  {
    id: 'factory-funk-rhythm',
    name: 'Funk Rhythm',
    isFactory: true,
    pedalboard: {
      id: 'pb-funk-rhythm',
      name: 'Funk Rhythm',
      ampType: EFFECT_TYPE.AMP_CLEAN,
      ampParameters: [
        { id: 'gain', value: 0.3 },
        { id: 'bass', value: 1 },
        { id: 'mid', value: 2 },
        { id: 'treble', value: 4 },
        { id: 'presence', value: 2 },
        { id: 'master', value: 0.7 },
      ],
      effects: [
        {
          id: 'fx-fr-comp',
          type: EFFECT_TYPE.COMPRESSOR,
          isBypassed: false,
          parameters: [
            { id: 'threshold', value: -15 },
            { id: 'ratio', value: 6 },
            { id: 'attack', value: 0.005 },
            { id: 'release', value: 0.12 },
            { id: 'knee', value: 6 },
          ],
        },
        {
          id: 'fx-fr-phaser',
          type: EFFECT_TYPE.PHASER,
          isBypassed: false,
          parameters: [
            { id: 'rate', value: 1.2 },
            { id: 'depth', value: 0.5 },
            { id: 'feedback', value: 0.35 },
            { id: 'mix', value: 0.45 },
          ],
        },
        {
          id: 'fx-fr-tremolo',
          type: EFFECT_TYPE.TREMOLO,
          isBypassed: false,
          parameters: [
            { id: 'rate', value: 4.5 },
            { id: 'depth', value: 0.4 },
            { id: 'mix', value: 0.6 },
          ],
        },
      ],
    },
  },
] as const;
