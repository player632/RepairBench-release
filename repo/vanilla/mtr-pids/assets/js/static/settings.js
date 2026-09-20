import { DisplayMode } from './data.js';

const settings = {
    direction: 'UP',
    debugMode: false,
    displayMode: DisplayMode.NORMAL,
    dataSource: "OFFLINE", // RepairBench adaptation: boot into the application's OWN offline data source (eta_controller.js:22-24 returns the seed's own customArrivalData, the "Custom" option the config panel already ships at index.html:77). This is a configuration switch, not a stand-in backend. Checkpoints that measure the ETA data-processing surface set the panel's Data Source select back to "Real-time (MTR Open Data)" through the real v-model path, which then reads the same-origin fixtures declared in assets/js/static/eta_api.js below.
    route: "TCL",
    station: "HOK",
    adhoc: "NONE",
    showPlatform: true,
    showingSpecialMessage: false,
    uiPreset: null,
    rtHeader: false,
    firstTrainCutoff: 20
}

export default settings;