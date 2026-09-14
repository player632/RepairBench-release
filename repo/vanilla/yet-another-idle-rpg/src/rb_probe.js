/* rb_probe.js - READ-ONLY verification surface added by the harness (environment/instrumentation.patch).
 *
 * This module is not part of the game. It exists so the checker can read the page instead of guessing
 * at it. It is loaded as a module script AFTER the game's own entry module, and it imports every module
 * it reads as a NAMESPACE (`import * as`), never by named binding: a namespace import does not fail to
 * link when an export disappears, so if a repair renames or drops an export the affected handle simply
 * reports its sentinel and the checkpoint that reads it goes red on behaviour, instead of the whole probe
 * module failing to link and taking every checkpoint down with it.
 *
 * Discipline this file obeys, and which any edit to it must keep:
 *   1. PURE READ. Nothing here writes to the document, to the game state, to storage, to a CSS custom
 *      property or to any module binding. There is no setter, no assignment to anything outside this
 *      module's own locals, no click(), no dispatchEvent(), no localStorage access other than reading
 *      key names, and no caching: every handle recomputes from the live page on every call.
 *   2. TOTAL. Every handle is wrapped so it returns a sentinel instead of throwing. A handle that threw
 *      would turn a behavioural red into a runner error, which is weaker evidence and harder to triage.
 *   3. SCALAR. Every handle returns a string, a number, a boolean or null, because the checker compares
 *      with a loose `==`: an object or an array would never compare equal to anything.
 *   4. NON-WRITABLE. The facade object is frozen and hung off `window` as one non-enumerable,
 *      non-writable, non-configurable property, so a repair cannot be rewarded for editing the probe
 *      surface instead of the page. `facadeWritableMembers()` reports 0 for exactly that reason, and
 *      `harnessGlobals()` / `foreignGlobals()` let a checkpoint pin that this module is the only global
 *      the harness added and that nothing else parked itself on `window`.
 *
 * Sentinels: strings report "__rb_unavailable__", numbers report -999999, booleans report null. None of
 * them can accidentally equal a real reading.
 */

import * as rb_main from "./main.js";
import * as rb_character from "./character.js";
import * as rb_stances from "./combat_stances.js";
import * as rb_storage from "./storage.js";
import * as rb_time from "./game_time.js";
import * as rb_misc from "./misc.js";
import * as rb_display from "./display.js";
import * as rb_skills from "./skills.js";
import * as rb_items from "./items.js";
import * as rb_quests from "./quests.js";
import * as rb_locations from "./locations.js";
import * as rb_version from "./game_version.js";

const RB_STR_SENTINEL = "__rb_unavailable__";
const RB_NUM_SENTINEL = -999999;

/* A handle must never throw: the wrapper converts any failure into the declared sentinel. */
function rb_read(fn, sentinel) {
    try {
        const value = fn();
        return value === undefined ? sentinel : value;
    } catch (error) {
        return sentinel;
    }
}

function rb_module_member(module_namespace, name) {
    return rb_read(() => module_namespace[name], undefined);
}

function rb_element(id) {
    return rb_read(() => document.getElementById(id), null);
}

function rb_text(id) {
    return rb_read(() => {
        const node = document.getElementById(id);
        if (!node) { return RB_STR_SENTINEL; }
        return String(node.innerText === undefined || node.innerText === null ? node.textContent : node.innerText);
    }, RB_STR_SENTINEL);
}

function rb_child_text(id, index) {
    return rb_read(() => {
        const node = document.getElementById(id);
        if (!node || !node.children[index]) { return RB_STR_SENTINEL; }
        return String(node.children[index].innerText);
    }, RB_STR_SENTINEL);
}

function rb_inline_var(name) {
    return rb_read(() => String(document.documentElement.style.getPropertyValue(name)), RB_STR_SENTINEL);
}

function rb_computed_var(name) {
    return rb_read(() => String(window.getComputedStyle(document.documentElement).getPropertyValue(name)).trim(), RB_STR_SENTINEL);
}

function rb_checked(id) {
    return rb_read(() => {
        const node = document.getElementById(id);
        return node ? node.checked === true : null;
    }, null);
}

function rb_rows(id) {
    return rb_read(() => {
        const node = document.getElementById(id);
        return node ? node.children.length : RB_NUM_SENTINEL;
    }, RB_NUM_SENTINEL);
}

function rb_inventory_row(index) {
    return rb_read(() => {
        const node = document.getElementById("inventory_content_div");
        return node && node.children[index] ? node.children[index] : null;
    }, null);
}

function rb_units(inventory) {
    return rb_read(() => {
        if (!inventory) { return RB_NUM_SENTINEL; }
        let total = 0;
        Object.keys(inventory).forEach((key) => { total += Number(inventory[key].count) || 0; });
        return total;
    }, RB_NUM_SENTINEL);
}

function rb_key_count(inventory) {
    return rb_read(() => (inventory ? Object.keys(inventory).length : RB_NUM_SENTINEL), RB_NUM_SENTINEL);
}

function rb_probe_time(overrides) {
    const GameTime = rb_module_member(rb_time, "Game_Time");
    if (typeof GameTime !== "function") { return null; }
    return rb_read(() => new GameTime(Object.assign({ year: 999, month: 4, day: 1, hour: 8, minute: 0, day_count: 1 }, overrides || {})), null);
}

function rb_clock() {
    return rb_module_member(rb_time, "current_game_time");
}

function rb_options() {
    return rb_module_member(rb_main, "game_options");
}

function rb_stance_table() {
    return rb_module_member(rb_stances, "stances");
}

function rb_misc_fn(name) {
    return rb_module_member(rb_misc, name);
}

const RB_WEEKDAY_TABLE = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const RB_SEASON_TABLE = ["Spring", "Summer", "Autumn", "Winter"];
const RB_CLOCK_SHAPE = /^\d{2}\/\d{2}\/\d+ \d{2}:\d{2}, (Spring|Summer|Autumn|Winter), (Mon|Tue|Wed|Thu|Fri|Sat|Sun), (Day|Night)$/;
const RB_COUNTDOWN_SHAPE = /^Reward available in: \d+:\d+:\d+ real time$/;

const rb_facade = {
    /* ---------- purse, money formatting and price rounding ---------- */
    purse: () => rb_read(() => Number(rb_module_member(rb_character, "character").money), RB_NUM_SENTINEL),
    purseReadout: () => rb_text("money_div"),
    purseReadoutHasLabel: () => rb_read(() => rb_text("money_div").indexOf("Your purse contains:") === 0, null),
    moneyText: (amount) => rb_read(() => String(rb_module_member(rb_display, "format_money")(amount)), RB_STR_SENTINEL),
    moneyCoinCount: (amount, coin_class) => rb_read(() => {
        const text = String(rb_module_member(rb_display, "format_money")(amount));
        return (text.match(new RegExp(String(coin_class), "g")) || []).length;
    }, RB_NUM_SENTINEL),
    priceRounded: (price) => rb_read(() => Number(rb_misc_fn("round_item_price")(price)), RB_NUM_SENTINEL),
    inventoryRowValueText: (index) => rb_read(() => {
        const row = rb_inventory_row(index);
        if (!row) { return RB_STR_SENTINEL; }
        const value_node = row.querySelector(".item_value");
        return value_node ? String(value_node.innerText) : RB_STR_SENTINEL;
    }, RB_STR_SENTINEL),

    /* ---------- unit conversion, contrast and the other pure helpers ---------- */
    fahrenheitOf: (celsius) => rb_read(() => Number(rb_misc_fn("celsius_to_fahrenheit")(celsius)), RB_NUM_SENTINEL),
    outlineClassFor: (hex) => rb_read(() => String(rb_misc_fn("select_outline_class")(hex)), RB_STR_SENTINEL),
    outlineClassesUsed: (hex_list) => rb_read(() => {
        const seen = {};
        String(hex_list).split(",").forEach((hex) => { seen[rb_facade.outlineClassFor(hex)] = true; });
        return Object.keys(seen).sort().join(",");
    }, RB_STR_SENTINEL),
    hitChance: (attack_points, evasion_points) => rb_read(() => Number(rb_misc_fn("get_hit_chance")(attack_points, evasion_points)), RB_NUM_SENTINEL),
    readingTime: (minutes) => rb_read(() => String(rb_misc_fn("format_reading_time")(minutes)), RB_STR_SENTINEL),
    workingTime: (minutes) => rb_read(() => String(rb_misc_fn("format_working_time")(minutes)), RB_STR_SENTINEL),
    expoOf: (amount) => rb_read(() => String(rb_misc_fn("expo")({ number: amount })), RB_STR_SENTINEL),
    stripTrailingPeriod: (text) => rb_read(() => String(rb_misc_fn("rtp")(text)), RB_STR_SENTINEL),
    versionCompare: (a, b) => rb_read(() => Number(rb_misc_fn("compare_game_version")(a, b)), RB_NUM_SENTINEL),
    versionOlder: (a, b) => rb_read(() => rb_misc_fn("is_a_older_than_b")(a, b) === true, null),
    clamped: (value, low, high) => rb_read(() => Number(rb_misc_fn("clamp")(value, low, high)), RB_NUM_SENTINEL),
    componentRenamed: (name) => rb_read(() => String(rb_misc_fn("get_component_name")(name)), RB_STR_SENTINEL),
    gameVersion: () => rb_read(() => String(rb_module_member(rb_version, "get_game_version")()), RB_STR_SENTINEL),

    /* ---------- calendar: every reading below is a relation, never an absolute clock value ---------- */
    clockReadout: () => rb_text("time_div"),
    clockShapeOk: () => rb_read(() => RB_CLOCK_SHAPE.test(String(rb_text("time_div")).trim()), null),
    weekdayName: () => rb_read(() => String(rb_clock().getDayOfTheWeek()), RB_STR_SENTINEL),
    weekdayIndex: () => rb_read(() => Number(rb_clock().day_count) % 7, RB_NUM_SENTINEL),
    weekdayTableAgrees: () => rb_read(() => RB_WEEKDAY_TABLE[Number(rb_clock().day_count) % 7] === String(rb_clock().getDayOfTheWeek()), null),
    weekdayForIndex: (index) => rb_read(() => {
        const probe = rb_probe_time({ day_count: Number(index) });
        return probe ? String(probe.getDayOfTheWeek()) : RB_STR_SENTINEL;
    }, RB_STR_SENTINEL),
    weekdayTableOk: () => rb_read(() => RB_WEEKDAY_TABLE.every((name, index) => rb_facade.weekdayForIndex(index) === name), null),
    seasonName: () => rb_read(() => String(rb_clock().getSeason()), RB_STR_SENTINEL),
    seasonForMonth: (month) => rb_read(() => {
        const probe = rb_probe_time({ month: Number(month), day: 1 });
        return probe ? String(probe.getSeason()) : RB_STR_SENTINEL;
    }, RB_STR_SENTINEL),
    seasonTableOk: () => rb_read(() => RB_SEASON_TABLE.every((name, index) => rb_facade.seasonForMonth(index * 3 + 1) === name), null),
    seasonList: () => rb_read(() => rb_module_member(rb_time, "seasons").join(","), RB_STR_SENTINEL),
    timeOfDayForHour: (hour) => rb_read(() => {
        const probe = rb_probe_time({ hour: Number(hour) });
        return probe ? String(probe.getTimeOfDay()) : RB_STR_SENTINEL;
    }, RB_STR_SENTINEL),
    moonPhaseNameOf: (phase) => rb_read(() => {
        const probe = rb_probe_time({});
        return probe ? String(probe.getMoonPhaseName(Number(phase))) : RB_STR_SENTINEL;
    }, RB_STR_SENTINEL),
    moonPhaseInRange: () => rb_read(() => {
        const phase = Number(rb_clock().getMoonPhase());
        return phase >= 0 && phase < 1;
    }, null),
    nightWindow: () => rb_read(() => {
        const night = rb_module_member(rb_time, "night_time");
        return night.start + "-" + night.end;
    }, RB_STR_SENTINEL),
    formattedTime: (minutes, hours, days, months, years) => rb_read(() => String(rb_module_member(rb_time, "format_time")({
        time: { minutes: Number(minutes), hours: Number(hours), days: Number(days), months: Number(months), years: Number(years) },
    })), RB_STR_SENTINEL),

    /* ---------- stances ---------- */
    stanceCount: () => rb_read(() => Object.keys(rb_stance_table()).length, RB_NUM_SENTINEL),
    stanceIds: () => rb_read(() => Object.keys(rb_stance_table()).sort().join(","), RB_STR_SENTINEL),
    stanceNameOf: (id) => rb_read(() => String(rb_stance_table()[id].name), RB_STR_SENTINEL),
    stanceUnlockedCount: () => rb_read(() => Object.keys(rb_stance_table()).filter((key) => rb_stance_table()[key].is_unlocked === true).length, RB_NUM_SENTINEL),
    stanceUnlockedIds: () => rb_read(() => Object.keys(rb_stance_table()).filter((key) => rb_stance_table()[key].is_unlocked === true).sort().join(","), RB_STR_SENTINEL),
    stanceTargetCountOf: (id) => rb_read(() => Number(rb_stance_table()[id].target_count), RB_NUM_SENTINEL),
    stanceStaminaCostOf: (id) => rb_read(() => Number(rb_stance_table()[id].stamina_cost), RB_NUM_SENTINEL),
    stanceMultiplierOf: (id, stat) => rb_read(() => Number(rb_stance_table()[id].stat_multipliers[stat]), RB_NUM_SENTINEL),
    activeStanceReadout: () => rb_child_text("character_stance_name", 0),
    selectedStanceId: () => rb_read(() => String(rb_module_member(rb_main, "selected_stance").id), RB_STR_SENTINEL),
    currentStanceId: () => rb_read(() => String(rb_module_member(rb_main, "current_stance").id), RB_STR_SENTINEL),
    rosterRowCount: () => rb_rows("stance_list"),
    rosterStanceRowCount: () => rb_read(() => {
        const node = rb_element("stance_list");
        return node ? node.querySelectorAll("tr[data-stance]").length : RB_NUM_SENTINEL;
    }, RB_NUM_SENTINEL),
    rosterRowStanceIds: () => rb_read(() => {
        const node = rb_element("stance_list");
        if (!node) { return RB_STR_SENTINEL; }
        return Array.prototype.map.call(node.querySelectorAll("[data-stance]"), (row) => row.getAttribute("data-stance")).join(",");
    }, RB_STR_SENTINEL),
    rosterSelectChecked: () => rb_read(() => {
        const input = document.querySelector('#stance_list tr[data-stance="normal"] td:nth-child(2) input');
        return input ? input.checked === true : null;
    }, null),
    rosterFavChecked: () => rb_read(() => {
        const input = document.querySelector('#stance_list tr[data-stance="normal"] td:nth-child(1) input');
        return input ? input.checked === true : null;
    }, null),
    quickBarCount: () => rb_rows("character_stance_selection"),
    quickBarStanceIds: () => rb_read(() => {
        const node = rb_element("character_stance_selection");
        if (!node) { return RB_STR_SENTINEL; }
        return Array.prototype.map.call(node.querySelectorAll("[data-stance]"), (row) => row.getAttribute("data-stance")).join(",");
    }, RB_STR_SENTINEL),
    quickBarLabels: () => rb_read(() => {
        const node = rb_element("character_stance_selection");
        if (!node) { return RB_STR_SENTINEL; }
        return Array.prototype.map.call(node.querySelectorAll("label"), (label) => String(label.innerText)).join(",");
    }, RB_STR_SENTINEL),
    favedStanceIds: () => rb_read(() => Object.keys(rb_module_member(rb_main, "faved_stances") || {}).sort().join(","), RB_STR_SENTINEL),

    /* ---------- inventories ---------- */
    inventoryRowCount: () => rb_rows("inventory_content_div"),
    inventoryRowsHaveNames: () => rb_read(() => {
        const node = rb_element("inventory_content_div");
        if (!node || !node.children.length) { return null; }
        return Array.prototype.every.call(node.children, (row) => String(row.textContent || "").trim().length > 0);
    }, null),
    rowIsEquippable: (index) => rb_read(() => {
        const row = rb_inventory_row(index);
        return row ? row.classList.contains("character_item_equippable") === true : null;
    }, null),
    rowCountTexts: () => rb_read(() => {
        const node = rb_element("inventory_content_div");
        if (!node) { return RB_STR_SENTINEL; }
        return Array.prototype.map.call(node.children, (row) => row.getAttribute("data-item_count")).join(",");
    }, RB_STR_SENTINEL),
    rowKeys: () => rb_read(() => {
        const node = rb_element("inventory_content_div");
        if (!node) { return RB_STR_SENTINEL; }
        return Array.prototype.map.call(node.children, (row) => row.getAttribute("data-character_item")).join(",");
    }, RB_STR_SENTINEL),
    rowCategoryTags: () => rb_read(() => {
        const node = rb_element("inventory_content_div");
        if (!node) { return RB_STR_SENTINEL; }
        return Array.prototype.map.call(node.children, (row) => {
            const tag = row.children[0] && row.children[0].children[0] && row.children[0].children[0].children[0];
            return tag ? String(tag.innerText) : RB_STR_SENTINEL;
        }).join(",");
    }, RB_STR_SENTINEL),
    rowUseButtonCount: () => rb_read(() => {
        const node = rb_element("inventory_content_div");
        return node ? node.querySelectorAll(".item_use_button").length : RB_NUM_SENTINEL;
    }, RB_NUM_SENTINEL),
    storageRowCount: () => rb_rows("storage_inventory_div"),
    storageOpen: () => rb_read(() => rb_module_member(rb_storage, "is_storage_open")() === true, null),
    storageKeyCount: () => rb_key_count(rb_module_member(rb_storage, "player_storage") ? rb_module_member(rb_storage, "player_storage").inventory : null),
    storageUnitTotal: () => rb_units(rb_module_member(rb_storage, "player_storage") ? rb_module_member(rb_storage, "player_storage").inventory : null),
    characterKeyCount: () => rb_key_count(rb_read(() => rb_module_member(rb_character, "character").inventory, null)),
    characterUnitTotal: () => rb_units(rb_read(() => rb_module_member(rb_character, "character").inventory, null)),

    /* ---------- options ---------- */
    optionKeySet: () => rb_read(() => Object.keys(rb_options()).sort().join(","), RB_STR_SENTINEL),
    optionTrueCount: () => rb_read(() => Object.keys(rb_options()).filter((key) => rb_options()[key] === true).length, RB_NUM_SENTINEL),
    flagTextsize: () => rb_read(() => rb_options().uniform_text_size_in_action === true, null),
    flagBedReturn: () => rb_read(() => rb_options().auto_return_to_bed === true, null),
    flagRememberFilters: () => rb_read(() => rb_options().remember_message_log_filters === true, null),
    flagCombatAutoswitchDisabled: () => rb_read(() => rb_options().disable_combat_autoswitch === true, null),
    flagDynamicLoot: () => rb_read(() => rb_options().do_dynamic_loot_message === true, null),
    flagTemperatureScale: () => rb_read(() => rb_options().use_uncivilised_temperature_scale === true, null),
    flagBackgroundAnimations: () => rb_read(() => rb_options().do_background_animations === true, null),
    flagBackgroundColor: () => rb_read(() => rb_options().change_background_color === true, null),
    flagSkipPlay: () => rb_read(() => rb_options().skip_play_button === true, null),
    flagMofu: () => rb_read(() => rb_options().mofu_mofu_mode === true, null),
    flagOnhitAnimations: () => rb_read(() => rb_options().do_enemy_onhit_animations === true, null),
    flagHideMaxLevel: () => rb_read(() => rb_options().hide_max_level_skills === true, null),
    flagTooltipOutlines: () => rb_read(() => rb_options().use_text_outlines_for_tooltips === true, null),
    flagBarOutlines: () => rb_read(() => rb_options().use_text_outlines_for_bars === true, null),
    expoThreshold: () => rb_read(() => String(rb_options().expo_threshold), RB_STR_SENTINEL),
    expoSliderValue: () => rb_read(() => String(rb_element("options_expo_threshold").value), RB_STR_SENTINEL),
    expoSliderReadout: () => rb_read(() => String(rb_element("options_expo_threshold").nextElementSibling.value), RB_STR_SENTINEL),
    controlChecked: (id) => rb_checked(String(id)),

    /* ---------- CSS custom properties ---------- */
    inlineVar: (name) => rb_inline_var(String(name)),
    computedVar: (name) => rb_computed_var(String(name)),
    actionTextSizeInline: () => rb_inline_var("--options_action_textsize"),
    actionTextSizeComputed: () => rb_computed_var("--options_action_textsize"),
    maxxedSkillInline: () => rb_inline_var("--maxxed_skill_display"),
    maxxedSkillComputed: () => rb_computed_var("--maxxed_skill_display"),
    backgroundOpacityInline: () => rb_inline_var("--background_opacity"),

    /* ---------- boot face, place, quests, skills ---------- */
    documentTitle: () => rb_read(() => String(document.title), RB_STR_SENTINEL),
    bootVeilVisibility: () => rb_read(() => String(rb_element("loading_screen").style.visibility), RB_STR_SENTINEL),
    bootVeilInlineVisibilitySet: () => rb_read(() => rb_element("loading_screen").style.visibility === "hidden", null),
    bootTitleMentionsName: () => rb_read(() => String(rb_text("loading_screen_game_title")).indexOf("Yet Another Idle RPG") >= 0, null),
    playButtonClasses: () => rb_read(() => String(rb_element("loading_screen_play_button").className), RB_STR_SENTINEL),
    playButtonText: () => rb_text("loading_screen_play_button"),
    bootStatusClasses: () => rb_read(() => String(rb_element("loading_screen_status").className), RB_STR_SENTINEL),
    bootVersionText: () => rb_text("loading_screen_version_info"),
    locationName: () => rb_text("location_name_span"),
    locationId: () => rb_read(() => String(rb_module_member(rb_main, "current_location").id), RB_STR_SENTINEL),
    locationCount: () => rb_read(() => Object.keys(rb_module_member(rb_locations, "locations")).length, RB_NUM_SENTINEL),
    questRowCount: () => rb_rows("quest_list"),
    activeQuestIds: () => rb_read(() => Object.keys(rb_module_member(rb_quests, "active_quests") || {}).sort().join(","), RB_STR_SENTINEL),
    skillRowCount: () => rb_rows("skill_list"),
    skillCount: () => rb_read(() => Object.keys(rb_module_member(rb_skills, "skills")).length, RB_NUM_SENTINEL),
    skillCategoryCount: () => rb_read(() => Object.keys(rb_module_member(rb_skills, "skill_categories")).length, RB_NUM_SENTINEL),
    itemTemplateCount: () => rb_read(() => Object.keys(rb_module_member(rb_items, "item_templates")).length, RB_NUM_SENTINEL),
    heroLevelText: () => rb_text("character_level_div"),
    heroNameValue: () => rb_read(() => String(rb_element("character_name_field").value), RB_STR_SENTINEL),
    healthReadout: () => rb_text("character_health_value"),
    staminaReadout: () => rb_text("character_stamina_value"),
    messageLogChildCount: () => rb_rows("message_box_div"),

    /* ---------- the real-time export reward, read only after the loop has ticked ---------- */
    exportRewardMarked: () => rb_read(() => rb_element("save_to_file_button").classList.contains("export_button_with_reward") === true, null),
    exportTooltip: () => rb_text("export_button_tooltip"),
    exportTooltipIsCountdown: () => rb_read(() => RB_COUNTDOWN_SHAPE.test(rb_text("export_button_tooltip")), null),
    exportControlClasses: () => rb_read(() => String(rb_element("save_to_file_button").className), RB_STR_SENTINEL),

    /* ---------- residue, isolation and the offline face ---------- */
    harnessGlobals: () => rb_read(() => Object.getOwnPropertyNames(window).filter((name) => name.indexOf("__rb") === 0).sort().join(","), RB_STR_SENTINEL),
    foreignGlobals: () => rb_read(() => Object.getOwnPropertyNames(window).filter((name) => name.indexOf("__") === 0 && name !== "__rb_yair").sort().join(","), RB_STR_SENTINEL),
    facadeWritableMembers: () => rb_read(() => Object.getOwnPropertyNames(rb_facade).filter((name) => {
        const descriptor = Object.getOwnPropertyDescriptor(rb_facade, name);
        return descriptor ? descriptor.writable === true : true;
    }).length, RB_NUM_SENTINEL),
    facadeMemberCount: () => rb_read(() => Object.getOwnPropertyNames(rb_facade).length, RB_NUM_SENTINEL),
    facadeFrozen: () => rb_read(() => Object.isFrozen(rb_facade) === true, null),
    localStorageKeySet: () => rb_read(() => Object.keys(window.localStorage).sort().join(","), RB_STR_SENTINEL),
    sessionStorageKeySet: () => rb_read(() => Object.keys(window.sessionStorage).sort().join(","), RB_STR_SENTINEL),
    sessionStorageCount: () => rb_read(() => window.sessionStorage.length, RB_NUM_SENTINEL),
    locationParts: () => rb_read(() => [window.location.pathname, window.location.search, window.location.hash].join("|"), RB_STR_SENTINEL),
    offOriginLinkCount: () => rb_read(() => Array.prototype.filter.call(document.querySelectorAll("link[href], script[src], img[src]"), (node) => {
        const url = String(node.getAttribute("href") || node.getAttribute("src") || "");
        return /^https?:/i.test(url);
    }).length, RB_NUM_SENTINEL),
    offOriginResourceCount: () => rb_read(() => window.performance.getEntriesByType("resource").filter((entry) => {
        const name = String(entry.name);
        if (/^(blob:|data:|about:|filesystem:)/.test(name)) { return false; }
        return name.indexOf(window.location.origin) !== 0;
    }).length, RB_NUM_SENTINEL),
    resourceEntryCount: () => rb_read(() => window.performance.getEntriesByType("resource").length, RB_NUM_SENTINEL),
};

Object.defineProperty(window, "__rb_yair", {
    value: Object.freeze(rb_facade),
    writable: false,
    enumerable: false,
    configurable: false,
});
