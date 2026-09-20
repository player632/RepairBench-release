const WEATHER_API = {
    HKO_RHRREAD: {
        name: "HKO RHRREAD",
        url: null // RepairBench adaptation: off-origin endpoint removed (see the guard in fetchWeatherData below).
    },
    HKO_WARNING_INFO: {
        name: "HKO Warning Info",
        url: null // RepairBench adaptation: off-origin endpoint removed (see the guard in fetchWeatherData below).
    }
}

export async function fetchWeatherData() {
    // RepairBench adaptation (G3/G5 off-origin neutralisation): the two data.weather.gov.hk endpoints above
    // are the only requests this module makes, and this task forbids network access. Instead of standing up a
    // substitute weather payload - which would put fabricated data on the measured surface - both URLs are set
    // to null and this guard returns the SAME value the seed's own catch branch below already returns (null).
    // The seed's own consumer already handles it: header_bar.js:16 `if (weatherData == null) return;`, i.e. the
    // weather icons and the temperature simply stay empty, which is the seed's own documented degradation path.
    // The original request body below is left byte-identical and unreachable. CONSEQUENCE, declared in meta.json:
    // the weather icon / temperature surface (header_bar.js:17-45) is NOT a defect site and carries no F2P
    // assertion on this face; only the pre-existing "weatherData == null renders nothing" behaviour is pinned (P07).
    if (WEATHER_API.HKO_RHRREAD.url == null || WEATHER_API.HKO_WARNING_INFO.url == null) {
        return null;
    }

    try {
        let rhrread = await fetch(WEATHER_API.HKO_RHRREAD.url);
        let warning = await fetch(WEATHER_API.HKO_WARNING_INFO.url);

        let rhrreadData = await rhrread.json();
        let warningData = await warning.json();

        let avgTemp = 0;
        for (const place of rhrreadData.temperature.data) {
            avgTemp = avgTemp + parseInt(place.value);
        }
        avgTemp /= rhrreadData.temperature.data.length;

        return {
            rhrread: rhrreadData,
            warning: warningData,
            avgTemp: avgTemp
        }
    } catch (err) {
        return null;
    }
}