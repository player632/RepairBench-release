// RepairBench instrumentation probe: installs the window.__RP__ bridge.
// Contract: live-only getters - every access performs a fresh read; component
// exposures (window.__RP_CONFIG__ / __RP_SHORTCUTS__ / __RP_PLAYBACK__) are
// re-assigned on every render by the instrumented components, so the bridge
// must never be cached across interactions by consumers.
import { MidiNumbers, KeyboardShortcuts } from 'react-piano';
import { lostWoods } from './songs';

window.__RP__ = {
  ready: true,
  fromNote: (note) => {
    try {
      return MidiNumbers.fromNote(note);
    } catch (e) {
      return -1;
    }
  },
  attrNote: (midiNumber) => {
    try {
      return MidiNumbers.getAttributes(midiNumber).note;
    } catch (e) {
      return 'ERR';
    }
  },
  naturalCount: () => MidiNumbers.NATURAL_MIDI_NUMBERS.length,
  homeRowFirst: () => KeyboardShortcuts.HOME_ROW[0].natural,
  songFirst: () => lostWoods[0][0],
  songSecond: () => lostWoods[1][0],
  songEntry0Length: () => lostWoods[0].length,
  songLength: () => lostWoods.length,
  config: () => window.__RP_CONFIG__ || null,
  shortcuts: () => window.__RP_SHORTCUTS__ || null,
  playback: () => window.__RP_PLAYBACK__ || null,
};
