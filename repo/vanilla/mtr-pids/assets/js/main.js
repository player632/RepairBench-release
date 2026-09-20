'use strict'

import ETA_CONTROLLER from './eta_controller.js'
import SETTINGS from './static/settings.js';
import UI from './ui.js'
import { getRoute } from './static/data.js';
import { getSuitableAPI } from './static/eta_api.js';

let etaData = [];

function parseQuery() {
    let params = (new URL(document.location)).searchParams;

    if(params.get("debug") == "true") {
        SETTINGS.debugMode = true;
    }
}

async function updateETA() {
    let route = getRoute(SETTINGS.route);
    let api = getSuitableAPI(SETTINGS.route);
    if (api == null) return;

    let data = await ETA_CONTROLLER.getETA(api, route.initials, SETTINGS.station, SETTINGS.direction);
    etaData = data;
}

// RepairBench instrumentation: read-only handles on the application's OWN singletons. Nothing is created,
// duplicated or cached here: SETTINGS is the seed's own module object (assets/js/static/settings.js), etaData is
// a getter over the module-local binding in this very file (line 9) that the seed never exposes, and the three
// remaining members are the seed's own imported functions. The seed publishes NO global at all, so without these
// the arrival model behind the rendered board (the ttnt numbers the display clamp and the cutoff gate read, the
// data source the panel binds, the debug flag the query parser sets) is unreachable from a checkpoint and four of
// the twelve defects would have no observable other than the pixels they happen to move.
window.__rb_pids = {
    get SETTINGS() { return SETTINGS; },
    get etaData() { return etaData; },
    getRoute: getRoute,
    getSuitableAPI: getSuitableAPI,
    ETA_CONTROLLER: ETA_CONTROLLER
};

$(document).ready(async function() {
    parseQuery();
    UI.setup();
    UI.draw([]);
    await updateETA();

    setInterval(() => {
        updateETA();
        // const isPaxUpdating = etaData[0]?.paxLoad?.length == 1;
        UI.draw(etaData);
    }, 1 * 1000);
});