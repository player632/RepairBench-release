import { RouteList, StationList, ArrivalEntry } from "./data.js"

function processLightRailData(data, route, stn, direction) {
    if (data.status == 0) {
        console.error(`No ETA Available: ${data.message}`);
        return [];
    }

    let finalData = [];
    for (const platform of data.platform_list) {
        let currentPlatform = platform.platform_id.toString();
        let isDeparture = false;

        for (const entry of platform.route_list) {
            /* Replace to only numbers, e.g. 2 min -> 2 */
            const ttnt = entry.time_en.replace(/[^0-9.]/g, '');
            let ttntNum = parseInt(ttnt);
            if (isNaN(ttntNum)) {
                if (entry.time_en == "-") ttntNum = 0;
                if (entry.time_en == "Arriving" || entry.time_en == "Departing") ttntNum = 1;
                isDeparture = entry.time_en == "Departing";
            }
            
            let arrivalEntry = new ArrivalEntry(`${entry.dest_ch}|${entry.dest_en}`, ttntNum, null, RouteList[`LR${entry.route_no}`], currentPlatform, true, isDeparture, null, 0, "");
            finalData.push(arrivalEntry);
        }
        finalData.sort((a, b) => String(a.ttnt).localeCompare(String(b.ttnt)));
    }
    return finalData;
}

function processHeavyRailData(data, route, stn, direction) {
    if (data.status == 0) {
        console.error(`No ETA Available: ${data.message}`);
        return [];
    }

    const routeAndStation = `${route}-${stn}`;
    let terminus = [];
    for(let term of RouteList[route].directionInfo ?? []) {
        terminus.push(...term.split(";"));
    }

    const isTermini = terminus.includes(stn);

    let tempArray = [];
    let finalData = [];
    let arrUP = [];
    let arrDN = [];
    
    if (direction == 'BOTH' || direction == 'BOTH_SPLIT') {
        if (data.data[routeAndStation].hasOwnProperty('UP')) {
            arrUP = data.data[routeAndStation]['UP'];
        }
        if (data.data[routeAndStation].hasOwnProperty('DOWN')) {
            arrDN = data.data[routeAndStation]['DOWN'];
        }
        
        arrUP.sort((a, b) => a.ttnt - b.ttnt);
        arrDN.sort((a, b) => a.ttnt - b.ttnt);
        
        if(direction == 'BOTH_SPLIT') {
            arrUP = arrUP.slice(0, 2);
            arrDN = arrDN.slice(0, 2);
        }
        
        /* Merge array from both directions */
        tempArray = arrUP.concat(arrDN);
        
        if(direction != 'BOTH_SPLIT') {
            /* Sort all by ETA */
            tempArray.sort((a, b) => a.ttnt - b.ttnt);
        }
    } else if (routeAndStation in data.data) {
        if (direction in data.data[routeAndStation]) {
            tempArray = data.data[routeAndStation][direction]
        } else {
            tempArray = [];
        }
        
        /* Sort by ETA */
        tempArray.sort((a, b) => a.ttnt - b.ttnt);
    }

    /* Convert data to adapt to a standardized format */
    for (const entry of tempArray) {
        let isDeparture = isTermini;
        let routeData = RouteList[route];
        let arrTime = new Date(`${entry.time.replace(" ", "T")}+08:00`);
        let sysTime = new Date(`${data.sys_time.replace(" ", "T")}+08:00`);

        /* Calculate the time difference */
        let ttnt = Math.max(Math.round((arrTime - sysTime) / 60000), 0);
        let destName = StationList.get(entry.dest).name;

        if (entry.timeType == "A") {
            isDeparture = true;
        } else if (entry.timeType == "D") {
            isDeparture = false;
        }

        /* EAL only */
        if (route == "EAL") {
            if (direction == "BOTH") {
                /* If this entry is for the UP Direction */
                if (arrUP.includes(entry)) {
                    entry.firstClass = 4;
                } else {
                    entry.firstClass = 6;
                }
            } else {
                entry.firstClass = direction == "UP" ? 4 : 6
            }
        }

        let arrivalEntry = new ArrivalEntry(destName, ttnt, arrTime, routeData, entry.plat, false, isDeparture, entry.paxLoad ?? null, entry.firstClass, entry.route);
        finalData.push(arrivalEntry);
    }

    return finalData;
}

const ETA_API = [
    {
        name: "MTR Open Data",
        urls: [
            "./fixtures/mtr/getSchedule/{rt}-{stn}.json",
            "./fixtures/mtr/getSchedule-fallback/{rt}-{stn}.json" // RepairBench adaptation: the two off-origin endpoints that used to sit here (rt.data.gov.hk primary, rp.lx86.workers.dev third-party reverse proxy) are replaced by two same-origin fixture paths, one per URL, in the same order. The {rt}/{stn} template placeholders and the two-URL fallback order are preserved verbatim, so the application still runs its own transformURL (eta_controller.js:66-68) and its own try/continue recovery loop (:32-47) - the loop is the mechanism under test, not the transport. Fixture bodies carry exactly the keys the seed's own parser reads (processHeavyRailData, this file :33-122): status, message, sys_time, isholiday, data["<rt>-<stn>"].UP/.DOWN[].{time,dest,plat,timeType,paxLoad}.
        ],
        priority: 0,
        isSuitable: (lineName) => ["KTL", "TWL", "ISL", "TKL", "TML", "EAL", "TCL", "AEL", "SIL", "DRL"].includes(lineName),
        transformData: processHeavyRailData,
        requestConfig: (rt, stn) => {}
    },
    {
        name: "MTR Light Rail Data",
        urls: [
            "./fixtures/lrt/getSchedule/{stn}.json" // RepairBench adaptation: same-origin fixture, {stn} placeholder preserved. Body carries exactly the keys processLightRailData (this file :3-31) reads: status, message, platform_list[].{platform_id,end_service_status,route_list[].{route_no,dest_ch,dest_en,time_en,time_ch}}.
        ],
        priority: 1,
        isSuitable: (lineName) => lineName.startsWith("LR"),
        transformData: processLightRailData,
        requestConfig: (rt, stn) => {}
    }
]

function getSuitableAPI(lineName) {
    let sortedApis = ETA_API.sort((e, f) => e.priority - f.priority);
    for(let api of sortedApis) {
        if(api.isSuitable(lineName)) return api;
    }
    console.warn(`Unknown API for: ${lineName}`);
    return null;
}

export { getSuitableAPI };