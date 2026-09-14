// instrumentation: read-only probe bridge for verification (window.__IO808__)
import variationSelector from "selectors/variation";
import { stepKey, patternLengthKey } from "helpers";

export function installProbe(store) {
  const read = () => {
    const s = store.getState();
    return {
      playing: s.playing,
      selectedMode: s.selectedMode,
      currentStep: s.currentStep,
      currentPart: s.currentPart,
      currentVariation: s.currentVariation,
      currentPattern: s.currentPattern,
      currentMeasure: s.currentMeasure,
      basicVariationPosition: s.basicVariationPosition,
      introFillVariationPosition: s.introFillVariationPosition,
      autoFillInPosition: s.autoFillInPosition,
      selectedInstrumentTrack: s.selectedInstrumentTrack,
      selectedPattern: s.selectedPattern,
      selectedPlayPattern: s.selectedPlayPattern,
      selectedPlayFillPattern: s.selectedPlayFillPattern,
      masterVolume: s.masterVolume,
      tempo: s.tempo,
      fineTempo: s.fineTempo,
      blinkState: s.blinkState,
      fillScheduled: s.fillScheduled,
      stepsCount: Object.keys(s.steps).length,
      variationLight: variationSelector(s),
      persistKeyList: Object.keys(window.localStorage).filter(k =>
        k.indexOf("persist:") === 0
      )
    };
  };
  window.__IO808__ = {
    read,
    step: (pattern, instrument, part, variation, step) =>
      store.getState().steps[
        stepKey(pattern, instrument, part, variation, step)
      ],
    length: (pattern, part) =>
      store.getState().patternLengths[patternLengthKey(pattern, part)],
    toggledKeys: () =>
      Object.keys(store.getState().steps).filter(
        k => store.getState().steps[k]
      ),
    snapshot: () => {
      const s = store.getState();
      const out = {};
      // mirror of the seed save filter (store-constants PERSISTANCE_FILTER)
      ["instrumentState","patternLengths","steps","masterVolume","tempo","fineTempo"].forEach(k => { out[k] = s[k]; });
      return out;
    },
    alerts: [],
    confirms: []
  };
  // instrumentation: record-and-dismiss modal dialogs so headless runs never hang
  window.alert = msg => {
    window.__IO808__.alerts.push(String(msg));
  };
  window.confirm = msg => {
    window.__IO808__.confirms.push(String(msg));
    return false;
  };
}
