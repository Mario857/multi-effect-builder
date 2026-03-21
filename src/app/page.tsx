'use client';

import { Header } from '@/components/layout/Header';
import { MeterStrip } from '@/components/audio/MeterStrip';
import { AmpSelector } from '@/components/pedalboard/AmpSelector';
import { PedalBoard } from '@/components/pedalboard/PedalBoard';
import { EffectRack } from '@/components/pedalboard/EffectRack';
import { ParameterPanel } from '@/components/pedalboard/ParameterPanel';
import { PresetManager } from '@/components/pedalboard/PresetManager';
import { Tuner } from '@/components/audio/Tuner';
import { usePedalboardPage } from '@/hooks/usePedalboardPage';

export default function HomePage() {
  const {
    isEngineRunning,
    isTunerActive,
    isEffectRackOpen,
    tunerReading,
    handleStartEngine,
    openEffectRack,
    closeEffectRack,
  } = usePedalboardPage();

  const tunerSection = isTunerActive ? <Tuner reading={tunerReading} /> : null;

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <Header
        onStartEngine={handleStartEngine}
        isEngineRunning={isEngineRunning}
      />

      {isEngineRunning && <MeterStrip />}

      <main className="flex flex-1 flex-col gap-4 p-4">
        {tunerSection}

        <AmpSelector />

        <div className="flex flex-col gap-4">
          <div className="glass-card card-highlight rounded-xl pedalboard-surface">
            <div className="border-b border-glass-border px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Signal Chain
              </span>
            </div>
            <PedalBoard onOpenEffectRack={openEffectRack} />
          </div>

          <ParameterPanel />
        </div>

        <PresetManager />
      </main>

      <EffectRack isOpen={isEffectRackOpen} onClose={closeEffectRack} />
    </div>
  );
}
