'use client';

import { Header } from '@/components/layout/Header';
import { EngineErrorAlert } from '@/components/audio/EngineErrorAlert';
import { MeterStrip } from '@/components/audio/MeterStrip';
import { AmpSelector } from '@/components/pedalboard/AmpSelector';
import { PedalBoard } from '@/components/pedalboard/PedalBoard';
import { EffectRack } from '@/components/pedalboard/EffectRack';
import { ParameterPanel } from '@/components/pedalboard/ParameterPanel';
import { PresetManager } from '@/components/pedalboard/PresetManager';
import { Tuner } from '@/components/audio/Tuner';
import { Card } from '@/components/shared/Card';
import { usePedalboardPage } from '@/hooks/usePedalboardPage';

/** The pedalboard page: composes the header, meters, amp, signal chain, parameter panel and presets. */
export default function HomePage() {
  const {
    isEngineRunning,
    isEngineStarting,
    engineError,
    isTunerActive,
    isEffectRackOpen,
    handleStartEngine,
    handleStopEngine,
    openEffectRack,
    closeEffectRack,
  } = usePedalboardPage();

  const meterStrip = isEngineRunning ? <MeterStrip /> : null;
  // The error can be set while the engine keeps running (e.g. a failed input switch)
  const engineErrorAlert = engineError ? <EngineErrorAlert message={engineError} /> : null;
  const tunerSection = isTunerActive ? <Tuner /> : null;

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <Header
        isEngineRunning={isEngineRunning}
        isEngineStarting={isEngineStarting}
        onStartEngine={handleStartEngine}
        onStopEngine={handleStopEngine}
      />

      {meterStrip}
      {engineErrorAlert}

      <main className="flex flex-1 flex-col gap-4 p-4">
        {tunerSection}

        <AmpSelector />

        <Card variant="pedalboard" title="Signal Chain">
          <PedalBoard onOpenEffectRack={openEffectRack} />
        </Card>

        <ParameterPanel />

        <PresetManager />
      </main>

      <EffectRack isOpen={isEffectRackOpen} onClose={closeEffectRack} />
    </div>
  );
}
