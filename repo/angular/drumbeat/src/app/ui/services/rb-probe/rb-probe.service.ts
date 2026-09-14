import { Inject, Injectable } from '@angular/core';
import { IAudioEngine } from '../../../domain/ports/i-audio-engine';
import { AUDIO_ENGINE } from '../../../infrastructure/injection-tokens/audio-engine.token';
import { TempoAdapterService } from '../../../infrastructure/adapters/tempo-control/tempo-adapter.service';
import { SequencerService } from '../sequencer/sequencer.service';

export interface RbExportRecord {
  filename: string;
  type: string;
  size: number;
  blob: Blob;
}

// Repair-Bench instrumentation: stable probe surface for checkpoint
// assertions. Exposes the live services (state is read through them) and a
// capture list for exported blobs; see downloadBlob in blob.utils.ts.
@Injectable({ providedIn: 'root' })
export class RbProbe {
  readonly exports: RbExportRecord[] = [];

  constructor(
    readonly sequencerService: SequencerService,
    readonly tempoService: TempoAdapterService,
    @Inject(AUDIO_ENGINE) readonly soundService: IAudioEngine
  ) {
    (window as unknown as Record<string, unknown>)['__rb'] = this;
  }

  vm(): unknown {
    return this.sequencerService.vm$.getValue();
  }

  engineState(): unknown {
    return (window as unknown as { SequencerEngine: { getState(): unknown } }).SequencerEngine.getState();
  }
}
