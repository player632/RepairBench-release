"use strict";

console.log("%c\u25A0 %c\u25B6 %c\u25A0 %c PulseQuaver v" + DEFAULT_PARAMS.programVersion + " ",
	"color:#1ff", "color:#f81", "color:#bbb", "background-color:#000;color:#fff");

{
	Tone.context.lookAhead = getAppSettings("lookahead") || 0.15;

	console.log("Lookahead:", Tone.context.lookAhead);
	console.log("Sample rate:", Tone.context.sampleRate);
	console.log("Latency:", Tone.context.rawContext.baseLatency);

	// Disable closing browser window with back button (Android/PWA)
	if (history.length == 1) {
		history.replaceState({ alter: true }, "", location.href);
		history.pushState({ alter: true }, "", location.href);
	}

	if (history.state && history.state.alter) {
		window.onpopstate = function () {
			history.go(1);
			scheduler.stop();
		}
	}

	window.g_markCurrentSynth = function () {
		let previous = document.querySelectorAll("#synth-list-main > .synth-list-entry--current");
		if (previous.length > 0)
			previous[0].classList.remove("synth-list-entry--current");

		let element = document.getElementById("synth-list-entry_" + songObject.currentSynthIndex);
		if (element)
			element.classList.add("synth-list-entry--current");
	}

	window.g_markCurrentPattern = function () {
		let previous = document.querySelectorAll("#arrange-main .current-pattern-mark");
		if (previous.length > 0)
			previous[0].classList.remove("current-pattern-mark");

		let element = document.getElementById("arr_side_row-" + songObject.currentPatternIndex);
		if (element)
			element.classList.add("current-pattern-mark");
	}

	window.g_scrollToLastPattern = function () {
		setTimeout(() => {
			let rows = document.querySelectorAll("#arrange-main table tr:last-child");
			if (rows[0])
				rows[0].scrollIntoView();
		}, 0);
	}

	let styleForRows = document.getElementById("colored-rows-style");
	let styleTxt = ``;
	for (let i = 0; i < DEFAULT_PARAMS.colorSet.length; i++) {
		styleTxt += `
			#arrange-main tr.color-index-${i} td.js-fill-head {
                background-color: ${DEFAULT_PARAMS.colorSet[i]};
            }
            #arrange-main tr.color-index-${i} td.js-fill-tail {
                background-color: ${DEFAULT_PARAMS.colorSet[i]};
            }
            #arrange-main tr.color-index-${i} td:first-child {
                color: ${DEFAULT_PARAMS.colorSet[i]};
            }
            `;
	}
	styleForRows.innerText = styleTxt;

	let patternDiv = document.getElementById("pattern-main");
	// non-zero width indicates non-overlay scrollbar
	if (patternDiv.offsetWidth <= 1) {
		patternDiv.classList.add("add-scrollbar-spacing");
		document.getElementById("arrange-main").classList.add("add-scrollbar-spacing");
	}

	const songObject = new SongObject();

	const synthUi = new SynthUi(songObject);

	const patternUi = new PatternUi(songObject, synthUi.assignSynth, onSongChange);
	patternUi.build();

	const synthHelper = new SynthHelper(songObject, synthUi, onSynthListChange);
	synthHelper.buildPresetList();

	const arrangeUi = new ArrangeUi(songObject, onPatternSelect, DEFAULT_PARAMS);
	arrangeUi.build();

	const scheduler = new Scheduler(songObject, arrangeUi.setMarker, patternUi.setMarker);

	let schedListen = schedulerUi(scheduler, arrangeUi.setLoopMarkers);
	menuInit(songObject, onSongChange, synthHelper.loadSynth, scheduler.renderSong, scheduler.exportMidiSequence);
	waveformEditor(songObject);

	let samplerateBox = document.getElementById("samplerate-box");
	samplerateBox.appendChild(document.createTextNode("Sample rate: " + Tone.context.sampleRate));
	if (getAppSettings("samplerate"))
		samplerateBox.classList.add("sr-nondefault");

	// App init completed
	document.getElementById("startup-loading-title").style.display = "none";
	document.getElementById("startup-menu").style.display = "block";
	document.getElementById("input-import-track").focus();

	// Hotkeys
	document.addEventListener("keydown", (event) => {
		if (songObject.song.length == 0)
			return;

		if (event.target.type == "number" || event.target.type == "text")
			return;

		if (event.code == "Digit1")
			g_switchTab("arrange");

		if (event.code == "Digit2") {
			g_switchTab("pattern");
			patternUi.redrawAutomationRow();
		}

		if (event.code == "Digit3")
			g_switchTab("synth");

		if (event.code == "Digit4")
			g_switchTab("synth-list");

		if (event.code == "KeyM")
			synthHelper.toggleMixer();

		if (event.code == "KeyZ")
			schedListen.songPlay();

		if (event.code == "KeyX")
			schedListen.patternPlay();

		if (event.code == "KeyC")
			schedListen.loopPlay();

		if (event.code == "Space") {
			if (event.target.type == "checkbox")
				return;

			event.preventDefault();

			switch (window.g_activeTab) {
				case "arrange":
					schedListen.songPlay();
					break;

				case "pattern":
					schedListen.patternPlay();
					break;

				default:
					scheduler.stop();
			}
		}
	});

	document.addEventListener("keyup", (event) => {
		if (event.target.tagName != "INPUT" && event.code == "Space") {
			event.preventDefault();
		}
	});

	function onSongChange(isNewSong, stopCommand, preserveArrangeView) {
		if (!preserveArrangeView)
			arrangeUi.fillSongView();

		patternUi.redrawPattern();

		// Also updates pattern layer tabs
		synthHelper.rebuildSynthList();

		if (isNewSong) {
			let ind = songObject.currentSynthIndex;
			synthUi.assignSynth(songObject.synthParams[ind], songObject.synths[ind], songObject.synthNames[ind]);
		}

		switch (stopCommand) {
			case "stop":
				scheduler.stop();
				break;
			case "release":
				scheduler.release();
				break;
		}
	}

	function onSynthListChange(updArrangeView) {
		if (updArrangeView)
			arrangeUi.fillSongView();

		patternUi.rebuildPatternSynthList();
	}

	function onPatternSelect(isNewPattern) {
		scheduler.releasePattern();
		patternUi.redrawPattern();
		patternUi.rebuildPatternSynthList();

		if (isNewPattern)
			patternUi.setNewPatternSynth();
	}

	// ---- repair-bench instrumentation: read-only verification facade ----
	// Every handle below is a pure read of the document, of the two storage objects
	// or of the live song model. There is no setter, nothing is cached, nothing is
	// written anywhere and no member is writable or enumerable, so a repair cannot
	// be rewarded for satisfying the facade instead of the application.
	{
		const rbStr = (v) => (v === null || v === undefined ? "" : String(v));
		const rbEl = (id) => document.getElementById(id);
		const rbTrim = (v) => rbStr(v).replace(/\s+/g, " ").trim();
		const rbSong = () => songObject;
		const rbLayer = () => {
			const s = rbSong();
			return s.currentPattern.patternData[s.currentPattern.activeIndex];
		};
		const RB_KNOWN_STORAGE = ["pulseq-backup", "pulseq-settings"];

		const rb = {};
		const rbDef = (name, fallback, fn) => {
			rb[name] = function () {
				try {
					const v = fn.apply(null, arguments);
					return v === undefined ? fallback : v;
				} catch (e) {
					return fallback;
				}
			};
		};

		// --- generic document reads ---
		rbDef("exists", false, (id) => !!rbEl(id));
		rbDef("cls", "", (id) => rbStr(rbEl(id).className));
		rbDef("txt", "", (id) => rbTrim(rbEl(id).textContent));
		rbDef("val", "", (id) => rbStr(rbEl(id).value));
		rbDef("hasClass", false, (id, c) => rbEl(id).classList.contains(c));
		rbDef("checked", false, (id) => !!rbEl(id).checked);
		rbDef("disabled", false, (id) => !!rbEl(id).disabled);
		rbDef("modalOpen", false, (id) => !rbEl(id).classList.contains("nodisplay"));
		rbDef("qCount", -1, (sel) => document.querySelectorAll(sel).length);
		rbDef("qTexts", "", (sel) => Array.prototype.map.call(document.querySelectorAll(sel), (e) => rbTrim(e.textContent)).join("|"));
		rbDef("qClassCount", -1, (sel, c) => Array.prototype.filter.call(document.querySelectorAll(sel), (e) => e.classList.contains(c)).length);

		// --- step grid + piano column ---
		rbDef("seqCellClass", "", (col, row) => rbStr(rbEl("seq_col-" + col + "_row-" + row).className));
		rbDef("seqHasNote", false, (col, row) => rbStr(rbEl("seq_col-" + col + "_row-" + row).className).indexOf("fill-") >= 0);
		rbDef("seqFilledCount", -1, () => document.querySelectorAll('#pattern-main td[class*="fill-"]').length);
		rbDef("visibleStepCount", -1, () => {
			let n = 0;
			for (let j = 0; j < DEFAULT_PARAMS.maxPatternSteps; j++) {
				const cell = rbEl("seq_col-" + j + "_row-0");
				if (cell && cell.style.display !== "none")
					n++;
			}
			return n;
		});
		rbDef("pianoKeyCount", -1, () => document.querySelectorAll("#pattern-main table tr:not(:first-child):not(:last-child) td:first-child").length);
		rbDef("keyClass", "", (note) => rbStr(document.querySelector('td[data-note="' + note + '"]').className));
		rbDef("keyHasClass", false, (note, c) => document.querySelector('td[data-note="' + note + '"]').classList.contains(c));
		rbDef("keyText", "", (note) => rbTrim(document.querySelector('td[data-note="' + note + '"]').textContent));
		rbDef("blackKeyCount", -1, () => document.querySelectorAll("#pattern-main td.pattern-black-key").length);
		rbDef("blackKeyLabels", "", () => Array.prototype.map.call(document.querySelectorAll("#pattern-main td.pattern-black-key"), (e) => rbTrim(e.textContent)).join(""));
		rbDef("numberedSteps", "", () => Array.prototype.filter.call(document.querySelectorAll("#pattern-main table tr:first-child td"), (e) => rbTrim(e.textContent) !== "").map((e) => rbTrim(e.textContent)).join(","));
		rbDef("numberedStepCount", -1, () => Array.prototype.filter.call(document.querySelectorAll("#pattern-main table tr:first-child td"), (e) => rbTrim(e.textContent) !== "").length);
		rbDef("rootMarkCount", -1, () => document.querySelectorAll("#pattern-main td.key--root").length);
		rbDef("inscaleMarkCount", -1, () => document.querySelectorAll("#pattern-main td.key--inscale").length);
		rbDef("autoRowClass", "", () => rbStr(rbEl("pattern-auto-row").className));
		rbDef("autoCellCount", -1, () => document.querySelectorAll("#pattern-main td.js-auto-cell").length);

		// --- arrange view ---
		rbDef("arrRowCount", -1, () => document.querySelectorAll("#arrange-main table tr").length - 1);
		rbDef("arrRowLabel", "", (i) => rbTrim(rbEl("arr_side_row-" + i).textContent));
		rbDef("arrRowLabels", "", () => {
			const out = [];
			for (let i = 0; rbEl("arr_side_row-" + i); i++)
				out.push(rbTrim(rbEl("arr_side_row-" + i).textContent));
			return out.join("|");
		});
		rbDef("arrRowLabelCount", -1, () => {
			let n = 0;
			for (let i = 0; rbEl("arr_side_row-" + i); i++)
				if (rbTrim(rbEl("arr_side_row-" + i).textContent) !== "")
					n++;
			return n;
		});
		rbDef("arrHasRow", false, (i) => !!rbEl("arr_side_row-" + i));
		rbDef("arrCellClass", "", (col, row) => rbStr(rbEl("arr_col-" + col + "_row-" + row).className));
		rbDef("arrHasBlock", false, (col, row) => rbEl("arr_col-" + col + "_row-" + row).classList.contains("js-fill-head"));
		rbDef("arrHeaderClass", "", (col) => rbStr(rbEl("arr_col-" + col + "_header").className));
		rbDef("arrMarkedRowId", "", () => rbStr((document.querySelector("#arrange-main .current-pattern-mark") || {}).id));
		rbDef("arrColumnCount", -1, () => document.querySelectorAll("#arrange-main tr:first-child td.arrange-header").length);
		rbDef("timersText", "", () => rbTrim(rbEl("timers-area").textContent));

		// --- chrome: tabs, toast, dialogs, settings ---
		rbDef("activeTab", "", () => rbStr(window.g_activeTab));
		rbDef("tabClass", "", (name) => rbStr(rbEl(name + "-tab").className));
		rbDef("listTabClass", "", () => rbStr(rbEl("synth-list-tab").className));
		rbDef("bodyZoom", "", () => rbStr(document.body.style.zoom));
		rbDef("toastVisible", false, () => !rbEl("toast-alert").classList.contains("nodisplay"));
		rbDef("toastText", "", () => rbTrim(rbEl("toast-box").textContent));
		rbDef("dialogOpen", false, () => !rbEl("modal-alert").classList.contains("nodisplay"));
		rbDef("dialogText", "", () => rbTrim(rbEl("modal-alert-message").textContent));
		rbDef("dialogInput", "", () => rbStr(rbEl("input-modal-alert").value));
		rbDef("dialogInputType", "", () => rbStr(rbEl("input-modal-alert").type));
		rbDef("dialogCancelHidden", false, () => rbEl("button-alert-cancel").classList.contains("nodisplay"));

		// --- layers, instruments, lists ---
		rbDef("layerTabCount", -1, () => document.querySelectorAll(".js-pattern-layer-tab").length);
		rbDef("layerTabActive", "", () => rbStr((document.querySelectorAll(".js-pattern-layer-tab.tab--active")[0] || {}).dataset ? document.querySelectorAll(".js-pattern-layer-tab.tab--active")[0].dataset.index : ""));
		rbDef("layerTabNames", "", () => Array.prototype.map.call(document.querySelectorAll(".js-pattern-layer-tab"), (e) => rbTrim(e.textContent)).join("|"));
		rbDef("synthEntryCount", -1, () => document.querySelectorAll("#synth-list-main .synth-list-entry").length);
		rbDef("synthEntryNames", "", () => Array.prototype.map.call(document.querySelectorAll("#synth-list-main .synth-list-entry .synth-entry-name"), (e) => rbTrim(e.textContent)).join("|"));
		rbDef("listCaption", "", () => rbTrim(rbEl("synth-list-caption-area").textContent));
		rbDef("muteBtnClass", "", () => rbStr(rbEl("button-synth-mute").className));
		rbDef("mixerEntryCount", -1, () => document.querySelectorAll("#mixer-list-container .mixer-entry").length);
		rbDef("demoEntryCount", -1, () => document.querySelectorAll("#demo-list-container .js-demo-entry").length);
		rbDef("demoEntryNames", "", () => Array.prototype.map.call(document.querySelectorAll("#demo-list-container .js-demo-entry"), (e) => rbTrim(e.textContent)).join("|"));

		// --- live song model ---
		rbDef("patternCount", -1, () => rbSong().patterns.length);
		rbDef("patternNames", "", () => rbSong().patterns.map((p) => rbStr(p.name)).join("|"));
		rbDef("currentPatternIndex", -1, () => rbSong().currentPatternIndex);
		rbDef("currentPatternName", "", () => rbTrim(rbSong().currentPattern.name));
		rbDef("patternLength", -1, () => rbSong().currentPattern.length);
		rbDef("layerCount", -1, () => rbSong().currentPattern.patternData.length);
		rbDef("activeLayerIndex", -1, () => rbSong().currentPattern.activeIndex);
		rbDef("layerSynthIndexes", "", () => rbSong().currentPattern.patternData.map((d) => rbStr(d.synthIndex)).join("|"));
		rbDef("patternDataShared", false, () => {
			const p = rbSong().patterns;
			for (let i = 0; i < p.length; i++)
				for (let j = i + 1; j < p.length; j++)
					if (p[i].patternData === p[j].patternData)
						return true;
			return false;
		});
		rbDef("noteAt", "", (col) => rbStr(rbLayer().notes[col] || ""));
		rbDef("notesOfActiveLayer", "", () => rbLayer().notes.map((n) => rbStr(n || "-")).join("|"));
		rbDef("noteCountActive", -1, () => rbLayer().notes.filter((n) => !!n).length);
		rbDef("bpmModel", -1, () => rbSong().bpm);
		rbDef("bpmTransport", -1, () => Math.round(Tone.Transport.bpm.value));
		rbDef("barSteps", -1, () => rbSong().barSteps);
		rbDef("songBars", -1, () => rbSong().song.length);
		rbDef("playableLength", -1, () => rbSong().playableLength);
		rbDef("blockAt", false, (col, row) => !!(rbSong().song[col] && rbSong().song[col][row]));
		rbDef("blocksPlaced", -1, () => rbSong().song.reduce((n, bar) => n + bar.filter((x) => !!x).length, 0));
		rbDef("synthCount", -1, () => rbSong().synths.length);
		rbDef("synthNames", "", () => rbSong().synthNames.map((n) => rbStr(n)).join("|"));
		rbDef("currentSynthIndex", -1, () => rbSong().currentSynthIndex);
		rbDef("synthParam", "", (key) => rbStr(rbSong().synthParams[rbSong().currentSynthIndex][key]));
		rbDef("mutedCount", -1, () => rbSong().synths.filter((s) => s.isMuted).length);
		rbDef("songEmpty", false, () => rbSong().isSongEmpty());

		// --- residue / isolation ---
		rbDef("settingsRaw", "", () => rbStr(localStorage.getItem("pulseq-settings")));
		rbDef("storageKeys", "", () => Object.keys(localStorage).sort().join("|"));
		rbDef("storageKeysForeign", "", () => Object.keys(localStorage).filter((k) => RB_KNOWN_STORAGE.indexOf(k) < 0).sort().join("|"));
		rbDef("sessionKeys", "", () => Object.keys(sessionStorage).sort().join("|"));
		rbDef("locationParts", "", () => [location.pathname, location.search, location.hash].join("|"));
		rbDef("rbGlobals", "", () => Object.getOwnPropertyNames(window).filter((k) => k.indexOf("__rb") === 0).sort().join("|"));
		rbDef("facadeWritableMembers", -1, () => {
			const f = window.__rb_pulseq;
			return Object.getOwnPropertyNames(f).filter((k) => {
				const d = Object.getOwnPropertyDescriptor(f, k);
				return !d || d.writable || d.enumerable || d.configurable;
			}).length;
		});
		rbDef("facadeMemberCount", -1, () => Object.getOwnPropertyNames(window.__rb_pulseq).length);


		// --- lane/layer cross-reads (grid vs model, alias detection) ---
		rbDef("noteRowOf", -1, (note) => DEFAULT_PARAMS.noteSet.slice().reverse().indexOf(note));
		rbDef("gridNoteColumns", "", () => {
			const out = [];
			const len = rbSong().currentPattern.length;
			for (let c = 0; c < len; c++) {
				for (let r = 0; r < DEFAULT_PARAMS.noteSet.length; r++) {
					const cell = rbEl("seq_col-" + c + "_row-" + r);
					if (cell && rbStr(cell.className).indexOf("fill-") >= 0) {
						out.push(String(c));
						break;
					}
				}
			}
			return out.join(",");
		});
		rbDef("modelNoteColumns", "", () => rbLayer().notes.map((n, i) => (n ? String(i) : "")).filter((x) => x !== "").join(","));
		rbDef("gridFilledColumnCount", -1, () => {
			const s = rb.gridNoteColumns();
			return s === "" ? 0 : s.split(",").length;
		});
		rbDef("gridModelColumnsAgree", false, () => rb.gridNoteColumns() === rb.modelNoteColumns());
		rbDef("layerNoteCount", -1, (i) => rbSong().currentPattern.patternData[i].notes.filter((n) => !!n).length);
		rbDef("layerNoteAt", "", (i, c) => rbStr(rbSong().currentPattern.patternData[i].notes[c] || ""));
		rbDef("layerLengthAt", -1, (i, c) => {
			const v = rbSong().currentPattern.patternData[i].lengths[c];
			return v === undefined || v === null ? -1 : Number(v);
		});
		rbDef("layerArraysShared", false, () => {
			const d = rbSong().currentPattern.patternData;
			for (let i = 0; i < d.length; i++)
				for (let j = i + 1; j < d.length; j++)
					if (d[i].notes === d[j].notes || d[i].lengths === d[j].lengths || d[i].volumes === d[j].volumes)
						return true;
			return false;
		});
		rbDef("layerSynthIndexAt", "", (i) => rbStr(rbSong().currentPattern.patternData[i].synthIndex));

		// --- imported / whole-song pattern model ---
		rbDef("patternLengthAt", -1, (i) => (rbSong().patterns[i] ? rbSong().patterns[i].length : -1));
		rbDef("patternNameAt", "", (i) => rbTrim((rbSong().patterns[i] || {}).name));
		rbDef("patternsLongerThan", -1, (n) => rbSong().patterns.filter((p) => p.length > Number(n)).length);
		rbDef("patternLengthSum", -1, () => rbSong().patterns.reduce((a, p) => a + p.length, 0));

		// --- persisted settings payload ---
		rbDef("settingsParsedKind", "", () => {
			const raw = localStorage.getItem("pulseq-settings");
			if (raw === null)
				return "absent";
			let v;
			try {
				v = JSON.parse(raw);
			} catch (e) {
				return "unparseable";
			}
			if (v === null)
				return "null";
			if (Array.isArray(v))
				return "array";
			return typeof v;
		});
		rbDef("settingsRawIsObject", false, () => rb.settingsParsedKind() === "object");
		rbDef("settingsKeyCount", -1, () => {
			const raw = localStorage.getItem("pulseq-settings");
			if (!raw)
				return 0;
			let v;
			try {
				v = JSON.parse(raw);
			} catch (e) {
				return -1;
			}
			return v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).length : 0;
		});
		rbDef("settingsStored", "", (key) => {
			const raw = localStorage.getItem("pulseq-settings");
			if (!raw)
				return "";
			let v;
			try {
				v = JSON.parse(raw);
			} catch (e) {
				return "";
			}
			if (!v || typeof v !== "object")
				return "";
			const x = v[key];
			return x === undefined || x === null ? "" : rbStr(x);
		});
		rbDef("settingsKeyNames", "", () => {
			const raw = localStorage.getItem("pulseq-settings");
			if (!raw)
				return "";
			let v;
			try {
				v = JSON.parse(raw);
			} catch (e) {
				return "";
			}
			return v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).sort().join("|") : "";
		});

		// --- bar separator geometry ---
		rbDef("barSeparatorText", "", () => rbTrim(rbEl("bar-separator-style").innerText));
		rbDef("barSeparatorNthOffset", -1, () => {
			const t = rbStr(rbEl("bar-separator-style").innerText);
			const m = t.match(/nth-child\(\s*(\d+)n\s*(\+\s*\d+)?\s*\)/);
			if (!m)
				return -1;
			return m[2] ? Number(m[2].replace(/\s+/g, "")) : 0;
		});
		rbDef("barSeparatorNthStep", -1, () => {
			const t = rbStr(rbEl("bar-separator-style").innerText);
			const m = t.match(/nth-child\(\s*(\d+)n/);
			return m ? Number(m[1]) : -1;
		});
		rbDef("stepBorderColor", "", (col, row) => {
			const cell = rbEl("seq_col-" + col + "_row-" + row);
			if (!cell)
				return "";
			const d = rbStr(window.getComputedStyle(cell).borderRightColor).match(/\d+/g);
			return d ? d.join(",") : "";
		});
		rbDef("stepBorderWidth", "", (col, row) => {
			const cell = rbEl("seq_col-" + col + "_row-" + row);
			return cell ? rbTrim(window.getComputedStyle(cell).borderRightWidth) : "";
		});
		rbDef("barBoundaryColumnCount", -1, () => {
			const sep = rbStr(window.getComputedStyle(rbEl("seq_col-0_row-0")).borderRightColor);
			let n = 0;
			for (let c = 0; c < rbSong().currentPattern.length; c++) {
				const cell = rbEl("seq_col-" + c + "_row-0");
				if (cell && rbStr(window.getComputedStyle(cell).borderRightColor) !== sep)
					n++;
			}
			return n;
		});

		// --- instrument list ---
		rbDef("synthEntryCountMatchesModel", false, () => document.querySelectorAll("#synth-list-main .synth-list-entry").length === rbSong().synths.length);
		rbDef("synthEntryIds", "", () => Array.prototype.map.call(document.querySelectorAll("#synth-list-main .synth-list-entry"), (e) => rbStr(e.id)).join("|"));
		rbDef("currentSynthEntryMarks", -1, () => document.querySelectorAll("#synth-list-main .synth-list-entry--current").length);
		rbDef("patternLayerTabIndexes", "", () => Array.prototype.map.call(document.querySelectorAll(".js-pattern-layer-tab"), (e) => rbStr(e.dataset.index)).join("|"));
		rbDef("activeLayerTabIndex", "", () => {
			const t = document.querySelectorAll(".js-pattern-layer-tab.tab--active");
			return t.length ? rbStr(t[0].dataset.index) : "";
		});
		rbDef("activeLayerTabMarks", -1, () => document.querySelectorAll(".js-pattern-layer-tab.tab--active").length);

		// --- arrange view ---
		rbDef("arrangeStartPoint", -1, () => rbSong().arrangeStartPoint);
		rbDef("arrangeStartPointMarks", -1, () => document.querySelectorAll("#arrange-main .play-start-point").length);
		rbDef("arrBlockColumnOf", -1, (row) => {
			for (let c = 0; c < rbSong().song.length; c++)
				if (rbSong().song[c] && rbSong().song[c][row])
					return c;
			return -1;
		});
		rbDef("arrBlockRowOf", -1, (col) => {
			for (let r = 0; r < rbSong().patterns.length; r++)
				if (rbSong().song[col] && rbSong().song[col][r])
					return r;
			return -1;
		});
		rbDef("arrSideRowCount", -1, () => document.querySelectorAll("#arrange-main td.arrange-sidebar").length);

		// --- instrumentation census / off-origin evidence ---
		rbDef("probeCount", -1, () => document.querySelectorAll("[data-testid]").length);
		rbDef("probeNames", "", () => Array.prototype.map.call(document.querySelectorAll("[data-testid]"), (e) => rbStr(e.dataset.testid)).sort().join("|"));
		rbDef("resourceCount", -1, () => (window.performance && performance.getEntriesByType ? performance.getEntriesByType("resource").length : -1));
		rbDef("offOriginResourceCount", -1, () => {
			if (!window.performance || !performance.getEntriesByType)
				return -1;
			const here = location.origin;
			return performance.getEntriesByType("resource").filter((e) => {
				const n = String(e.name);
				if (!/^https?:/i.test(n))
					return false;
				try {
					return new URL(n).origin !== here;
				} catch (err) {
					return false;
				}
			}).length;
		});
		rbDef("offOriginLoadRefCount", -1, () => {
			const here = location.origin;
			const sel = "link[href], script[src], img[src], iframe[src], source[src], video[src], audio[src]";
			return Array.prototype.filter.call(document.querySelectorAll(sel), (e) => {
				const u = rbStr(e.getAttribute("href") || e.getAttribute("src"));
				if (!u || !/^[a-z][a-z0-9+.-]*:/i.test(u))
					return false;
				if (/^(data|blob|about):/i.test(u))
					return false;
				try {
					return new URL(u, location.href).origin !== here;
				} catch (err) {
					return false;
				}
			}).length;
		});
		rbDef("offOriginAnchorCount", -1, () => {
			const here = location.origin;
			return Array.prototype.filter.call(document.querySelectorAll("a[href]"), (e) => {
				const u = rbStr(e.getAttribute("href"));
				if (!u || !/^[a-z][a-z0-9+.-]*:/i.test(u))
					return false;
				try {
					return new URL(u, location.href).origin !== here;
				} catch (err) {
					return false;
				}
			}).length;
		});
		rbDef("loadRefCount", -1, () => document.querySelectorAll("link[href], script[src]").length);
		rbDef("scriptSrcCount", -1, () => document.querySelectorAll("script[src]").length);
		rbDef("dataUriRefCount", -1, () => {
			const sel = "link[href], script[src], img[src], iframe[src], source[src]";
			return Array.prototype.filter.call(document.querySelectorAll(sel), (e) => /^(data|blob):/i.test(rbStr(e.getAttribute("href") || e.getAttribute("src")))).length;
		});

		const rbFacade = {};
		for (const key of Object.keys(rb))
			Object.defineProperty(rbFacade, key, { value: rb[key], writable: false, enumerable: false, configurable: false });

		Object.defineProperty(window, "__rb_pulseq", { value: rbFacade, writable: false, enumerable: false, configurable: false });
	}
}