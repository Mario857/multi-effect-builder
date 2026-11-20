'use client';

import { TunerReadout } from '@/components/audio/TunerReadout';
import { Card } from '@/components/shared/Card';
import { useTunerDisplay } from '@/hooks/useTunerDisplay';

/** Chromatic tuner card: shows the detected note, or a prompt while there is nothing to show. */
export function Tuner() {
  const { tunerNote, isEngineRunning } = useTunerDisplay();

  const prompt = isEngineRunning ? 'Play a note' : 'Start audio to use the tuner';

  const content = tunerNote ? (
    <TunerReadout tunerNote={tunerNote} />
  ) : (
    <div className="flex flex-col items-center gap-2 py-2">
      <span className="font-pixel text-xl text-text-muted">--</span>
      <span className="text-xs text-text-muted">{prompt}</span>
    </div>
  );

  return (
    <Card variant="glass" padding="md" title="Tuner" isCentered>
      {content}
    </Card>
  );
}
