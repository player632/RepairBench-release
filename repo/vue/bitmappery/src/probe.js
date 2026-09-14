/* eslint-disable */
/**
 * RepairBench instrumentation probe (added by environment/instrumentation.patch).
 *
 * This file is NOT part of the application and carries no product behaviour. It exists
 * so that the external verifier can observe and drive the editor deterministically:
 *
 *   window.__BMPQ__()  -> a PURE READ snapshot of scalar values taken from the live Vuex
 *                         store and from the rendered DOM. It performs no click, no
 *                         dispatch, no commit and no navigation, because the runner polls
 *                         every assertion for up to ~9 s and a side effect inside an
 *                         assertion would be replayed hundreds of times.
 *   window.__BMPX__    -> a SETUP-ONLY command surface. Everything that mutates the page
 *                         (real element clicks, synthetic key events, input events,
 *                         dropdown picks, document/layer fixtures, storage seeding) lives
 *                         here and is only ever called from a checkpoint's setup block.
 *   window.__BMPF__    -> scalars measured during setup and frozen, so that no assertion
 *                         ever compares against a monotonic clock/counter value.
 *
 * Every value returned by __BMPQ__ is a scalar (number, string or boolean) because the
 * runner compares js_eval results with a loose == against a scalar expectation.
 */
import DocumentFactory from "@/model/factories/document-factory";
import { PANEL_TOOL_OPTIONS, PANEL_LAYERS } from "@/definitions/panel-types";

const PREF_KEY = "bpy_pref";
// every key the product itself is allowed to leave behind, taken from the source:
// preferences-module.ts STORAGE_KEY, font-service.ts gfontConsent / gfontRejected,
// the three cloud file selectors and dropbox-service.ts for sessionStorage.
const LS_WHITELIST = [ "bpy_pref", "gfontConsent", "gfontRejected" ];
const SS_WHITELIST = [ "bpy_s3Db", "bpy_driveDb", "bpy_dropboxDb", "dropboxToken" ];

let STORE = null;
let BOOT_GLOBALS = "";

const q   = ( sel ) => document.querySelector( sel );
const qa  = ( sel ) => Array.from( document.querySelectorAll( sel ));
const tid = ( id ) => `[data-testid="${id}"]`;
const sleep = ( ms ) => new Promise( resolve => window.setTimeout( resolve, ms ));
const frame = () => new Promise( resolve => window.requestAnimationFrame(() => resolve( true )));

// Vue flushes its render queue on a microtask, async components resolve on a promise and
// the canvas renderers settle on a frame: one macrotask plus one frame covers all three.
const settle = async ( ms = 90 ) => {
    await sleep( ms );
    await frame();
    await sleep( 0 );
};

const num = ( value, dflt ) => ( typeof value === "number" && isFinite( value )) ? value : dflt;
const str = ( value ) => ( value === undefined || value === null ) ? "" : String( value );
const bool = ( value ) => value === true;

const elText = ( id ) => {
    const el = q( tid( id ));
    return el ? ( el.textContent || "" ).trim() : "";
};
const elValue = ( sel ) => {
    const el = q( sel );
    return el ? str( el.value ) : "";
};
const elDisabled = ( id ) => {
    const el = q( tid( id ));
    return el ? !!el.disabled : null;
};
const elHasClass = ( id, cls ) => {
    const el = q( tid( id ));
    return el ? el.classList.contains( cls ) : null;
};
const rangeOf = ( id ) => {
    const wrap = q( tid( id ));
    if ( !wrap ) {
        return null;
    }
    return wrap.matches( "input" ) ? wrap : wrap.querySelector( 'input[type="range"]' );
};
const selectedLabelOf = ( id ) => {
    const wrap = q( tid( id ));
    if ( !wrap ) {
        return "";
    }
    const sel = wrap.querySelector( ".vs__selected" );
    return sel ? ( sel.textContent || "" ).trim() : "";
};
const readStoredPreference = ( name ) => {
    try {
        const raw = window.localStorage.getItem( PREF_KEY );
        if ( !raw ) {
            return null;
        }
        const parsed = JSON.parse( raw );
        return ( parsed && Object.prototype.hasOwnProperty.call( parsed, name )) ? parsed[ name ] : null;
    } catch {
        return null;
    }
};
const readStoredPreferenceKeys = () => {
    try {
        const raw = window.localStorage.getItem( PREF_KEY );
        if ( !raw ) {
            return "";
        }
        return Object.keys( JSON.parse( raw )).sort().join( "|" );
    } catch {
        return "ERR";
    }
};
const countCrossOriginRequests = () => {
    try {
        const here = window.location.origin;
        return performance.getEntriesByType( "resource" )
            .filter( entry => {
                try {
                    return new URL( entry.name, here ).origin !== here;
                } catch {
                    return false;
                }
            })
            .length;
    } catch {
        return -1;
    }
};
const probeGlobals = () => {
    try {
        return Object.keys( window )
            .filter( key => key.indexOf( "__" ) === 0 && [ "__BMPQ__", "__BMPX__", "__BMPF__" ].indexOf( key ) === -1 )
            .sort()
            .join( "|" );
    } catch {
        return "ERR";
    }
};

/**
 * PURE READ. Called by every assertion, therefore it must never touch the page.
 */
function snapshot() {
    const out = {
        probeVersion : 1,
        ready        : !!STORE,
        appChildren  : q( "#app" ) ? q( "#app" ).children.length : -1,
        screenAvailWidth : num( window.screen && window.screen.availWidth, -1 ),
        toolButtons  : qa( '[data-testid^="tool-"]' ).length,
        storageKeys  : "",
        storageCount : -1,
        sessionKeys  : "",
        sessionCount : -1,
        cookieLength : -1,
        pathname     : str( window.location.pathname ),
        search       : str( window.location.search ),
        hash         : str( window.location.hash ),
        newGlobals   : probeGlobals(),
        crossOriginRequests : countCrossOriginRequests(),
        resourceRequests    : -1,
    };
    try {
        out.storageKeys  = Object.keys( window.localStorage ).sort().join( "|" );
        out.storageCount = window.localStorage.length;
        out.sessionKeys  = Object.keys( window.sessionStorage ).sort().join( "|" );
        out.sessionCount = window.sessionStorage.length;
        out.lsOffWhitelist = Object.keys( window.localStorage ).filter( key => LS_WHITELIST.indexOf( key ) === -1 ).length;
        out.ssOffWhitelist = Object.keys( window.sessionStorage ).filter( key => SS_WHITELIST.indexOf( key ) === -1 ).length;
        out.cookieLength = ( document.cookie || "" ).length;
        out.resourceRequests = performance.getEntriesByType( "resource" ).length;
    } catch {
        // a blocked storage API is itself an observation, leave the sentinels
    }
    out.bootGlobals = BOOT_GLOBALS;
    out.globalResidueDelta = ( BOOT_GLOBALS === out.newGlobals ) ? 0 : 1;

    if ( !STORE ) {
        return out;
    }
    const state   = STORE.state;
    const getters = STORE.getters;
    const doc     = getters.activeDocument;
    const layers  = getters.layers || [];
    const active  = getters.activeLayer;
    const options = state.editor.options || {};
    const brush   = options.brush   || {};
    const eraser  = options.eraser  || {};
    const zoom    = options.zoom    || {};
    const fill    = options.fill    || {};
    const wand    = options.wand    || {};
    const clone   = options.clone   || {};
    const prefs   = ( state.preferences && state.preferences.preferences ) || {};
    let history;
    try {
        history = doc ? state.history.documents.get( doc.id ) : undefined;
    } catch {
        history = undefined;
    }

    // document
    out.docCount       = ( state.document.documents || [] ).length;
    out.hasDocument    = !!doc;
    out.docName        = str( doc && doc.name );
    out.docWidth       = num( doc && doc.width, -1 );
    out.docHeight      = num( doc && doc.height, -1 );
    out.docType        = str( doc && doc.type );
    out.docDpi         = num( doc && doc.meta && doc.meta.dpi, -1 );
    out.docUnit        = str( doc && doc.meta && doc.meta.unit );
    out.docSmoothing   = doc ? bool( doc.meta.smoothing ) : null;
    out.docBgColor     = str( doc && doc.meta && doc.meta.bgColor );
    out.docNames       = ( state.document.documents || [] ).map( d => str( d.name )).join( "|" );

    // layers
    out.layerCount         = layers.length;
    out.layerNames         = layers.map( l => str( l.name )).join( "|" );
    out.layerVisibility    = layers.map( l => ( l.visible ? "1" : "0" )).join( "" );
    out.layerTypes         = layers.map( l => str( l.type )).join( "|" );
    out.activeLayerIndex   = num( state.document.activeLayerIndex, -99 );
    out.hasActiveLayer     = !!active;
    out.activeLayerName    = str( active && active.name );
    out.activeLayerType    = str( active && active.type );
    out.activeLayerVisible = active ? bool( active.visible ) : null;
    out.activeLayerWidth   = num( active && active.width, -1 );
    out.activeLayerHeight  = num( active && active.height, -1 );
    out.activeLayerOpacity = num( active && active.filters && active.filters.opacity, -99 );
    out.activeLayerBlend   = str( active && active.filters && active.filters.blendMode );
    out.activeLayerFiltersEnabled = active ? bool( active.filters.enabled ) : null;
    out.maskActive         = bool( state.document.maskActive );

    // editor / tools
    out.activeTool     = str( state.editor.activeTool === null ? "none" : state.editor.activeTool );
    out.activeColor    = str( state.editor.activeColor );
    out.snapAlign      = bool( getters.snapAlign );
    out.antiAlias      = bool( getters.antiAlias );
    out.pixelGrid      = bool( getters.pixelGrid );
    out.showTrace      = bool( getters.showTrace );
    out.zoomLevel      = num( zoom.level, -999 );
    out.brushSize      = num( brush.size, -1 );
    out.brushType      = str( brush.type );
    out.brushOpacity   = num( brush.opacity, -99 );
    out.brushStrokes   = num( brush.strokes, -1 );
    out.brushThickness = num( brush.thickness, -99 );
    out.eraserSize     = num( eraser.size, -1 );
    out.eraserOpacity  = num( eraser.opacity, -99 );
    out.cloneSize      = num( clone.size, -1 );
    out.fillFeather    = num( fill.feather, -1 );
    out.fillThreshold  = num( fill.threshold, -99 );
    out.fillSmart      = bool( fill.smartFill );
    out.wandThreshold  = num( wand.threshold, -1 );
    out.wandSampleMerged = bool( wand.sampleMerged );

    // history
    out.canUndo        = bool( getters.canUndo );
    out.canRedo        = bool( getters.canRedo );
    out.historyStored  = num( history && history.stored, -1 );
    out.historyIndex   = num( history && history.historyIndex, -99 );

    // selection
    out.hasSelection   = bool( getters.hasSelection );

    // chrome state
    // store.modal (src/store/index.ts:55) is `number | null`: the ID of the single opened modal
    // window from definitions/modal-windows.ts (CREATE_DOCUMENT 1 ... DOCUMENT_PROPERTIES 18) or
    // null when none is open. The assertions read it as the COUNT of open modal windows, so null
    // maps to 0 and any open window maps to 1; the raw ID stays readable as modalId.
    out.modal          = ( state.modal === null || state.modal === undefined ) ? 0 : 1;
    out.modalId        = num( state.modal, -1 );
    out.blindActive    = bool( state.blindActive );
    out.dialogOpen     = !!state.dialog;
    out.dialogType     = str( state.dialog && state.dialog.type );
    out.dialogMessage  = str( state.dialog && state.dialog.message );
    out.menuOpened     = bool( state.menuOpened );
    out.toolboxOpened  = bool( state.toolboxOpened );
    out.openedPanels   = ( state.openedPanels || [] ).join( "|" );
    out.loading        = ( state.loadingStates || [] ).length;
    out.windowWidth    = num( state.windowSize && state.windowSize.width, -1 );
    out.windowHeight   = num( state.windowSize && state.windowSize.height, -1 );

    // preferences
    out.prefLowMemory  = bool( prefs.lowMemory );
    out.prefThumbnails = bool( prefs.thumbnails );
    out.prefWasm       = bool( prefs.wasmFilters );
    out.prefSnapAlign  = bool( prefs.snapAlign );
    out.prefAntiAlias  = bool( prefs.antiAlias );
    out.prefAutoAlias  = bool( prefs.autoAlias );
    out.storedPrefSnapAlign = readStoredPreference( "snapAlign" );
    out.storedPrefAntiAlias = readStoredPreference( "antiAlias" );
    out.storedPrefKeys = readStoredPreferenceKeys();

    // canvas dimensions module
    const dims = ( state.canvas && state.canvas.canvasDimensions ) || {};
    out.canvasWidth          = num( dims.width, -1 );
    out.canvasHeight         = num( dims.height, -1 );
    out.canvasVisibleWidth   = num( dims.visibleWidth, -1 );
    out.canvasVisibleHeight  = num( dims.visibleHeight, -1 );
    out.canvasMaxInScale     = num( dims.maxInScale, -99 );
    out.canvasMaxOutScale    = num( dims.maxOutScale, -99 );

    // ---- DOM derived scalars ----
    out.layerRowCount     = qa( tid( "layer-name" )).length;
    out.layerRowOrder     = qa( tid( "layer-name" )).map( el => ( el.textContent || "" ).trim() ).join( "|" );
    out.layerEmptyText    = elText( "layer-empty-text" );
    out.layerPanelTitle   = elText( "layer-panel-title" );
    out.toolOptionsEmpty  = elText( "options-panel-empty" );
    // same node under the name the assertions use (data-testid="options-panel-empty" in
    // tool-options-panel.vue): "" while a tool with options is active, the hint text while not.
    out.optionsPanelEmpty = out.toolOptionsEmpty;
    out.dialogTitleText   = elText( "dialog-title" );
    out.dialogMessageText = elText( "dialog-message" );
    out.notificationCount = qa( tid( "notification-message" )).length;
    out.notificationText  = qa( tid( "notification-message" )).map( el => ( el.textContent || "" ).trim() ).join( "|" );
    out.windowMenuEntries = qa( '[data-testid^="window-doc-"]' ).length;

    out.brushToolDisabled  = elDisabled( "tool-brush" );
    out.eraserToolDisabled = elDisabled( "tool-eraser" );
    out.cloneToolDisabled  = elDisabled( "tool-clone" );
    out.fillToolDisabled   = elDisabled( "tool-fill" );
    out.textToolDisabled   = elDisabled( "tool-text" );
    out.zoomToolDisabled   = elDisabled( "tool-zoom" );
    out.dragToolDisabled   = elDisabled( "tool-drag" );
    out.moveToolDisabled      = elDisabled( "tool-move" );
    out.selectionToolDisabled = elDisabled( "tool-selection" );
    out.lassoToolDisabled     = elDisabled( "tool-lasso" );
    out.wandToolDisabled      = elDisabled( "tool-wand" );
    out.scaleToolDisabled     = elDisabled( "tool-scale" );
    out.eyedropperToolDisabled = elDisabled( "tool-eyedropper" );
    out.rotateToolDisabled    = elDisabled( "tool-rotate" );
    out.mirrorToolDisabled    = elDisabled( "tool-mirror" );
    out.undoDisabled       = elDisabled( "history-undo" );
    out.redoDisabled       = elDisabled( "history-redo" );
    out.duplicateDisabled  = elDisabled( "layer-menu-duplicate" );
    out.addLayerDisabled   = elDisabled( "layer-add" );

    out.snapAlignChecked   = elHasClass( "view-snap-align", "checked" );
    out.antiAliasChecked   = elHasClass( "view-anti-alias", "checked" );
    out.pixelGridChecked   = elHasClass( "view-pixel-grid", "checked" );
    out.pixelGridDisabled  = elDisabled( "view-pixel-grid" );
    out.tracingDisabled    = elDisabled( "view-tracing" );

    const opacityRange = rangeOf( "compositing-opacity" );
    out.opacitySliderValue    = opacityRange ? str( opacityRange.value ) : "";
    out.opacitySliderDisabled = opacityRange ? !!opacityRange.disabled : null;
    out.opacitySliderMax      = opacityRange ? str( opacityRange.max ) : "";
    out.blendSelectedLabel    = selectedLabelOf( "compositing-blend" );
    out.blendOptionCount      = qa( ".vs__dropdown-option" ).length;

    const brushRange = rangeOf( "brush-size" );
    out.brushSizeSliderValue    = brushRange ? str( brushRange.value ) : "";
    out.brushSizeSliderDisabled = brushRange ? !!brushRange.disabled : null;
    out.brushTypeSelectedLabel  = selectedLabelOf( "brush-type" );
    out.brushTypeDisabled       = !!q( '[data-testid="brush-type"] .vs--disabled' );

    out.dimWidthValue  = elValue( tid( "dim-width" ));
    out.dimHeightValue = elValue( tid( "dim-height" ));
    out.dimUnitLabel   = selectedLabelOf( "dim-unit" );
    out.dimDpiLabel    = selectedLabelOf( "dim-dpi" );
    out.createNameValue = elValue( tid( "create-document-name" ));
    out.createButtonPresent = !!q( tid( "create-document-create" ));

    return out;
}

function keyEvent( type, code, opts ) {
    const event = new KeyboardEvent( type, {
        bubbles    : true,
        cancelable : true,
        altKey     : !!opts.altKey,
        shiftKey   : !!opts.shiftKey,
        ctrlKey    : !!opts.ctrlKey,
        metaKey    : !!opts.metaKey,
    });
    // keyCode/which are legacy accessors that the KeyboardEvent constructor does not
    // accept, and the application's shortcut table switches on event.keyCode.
    Object.defineProperty( event, "keyCode", { get: () => code });
    Object.defineProperty( event, "which",   { get: () => code });
    return event;
}

const X = {
    version: 1,

    /** resolves once the editor chrome is on screen (store live, toolbox rendered) */
    async waitReady( ms = 40000 ) {
        const limit = Date.now() + ms;
        while ( Date.now() < limit ) {
            if ( STORE && q( tid( "app-root" )) && q( tid( "menu-file" ))) {
                await settle( 120 );
                return true;
            }
            await sleep( 100 );
        }
        return false;
    },

    /** conditional wait: resolves true when the probe appears, false when it never does */
    async waitTestid( id, ms = 12000 ) {
        const limit = Date.now() + ms;
        while ( Date.now() < limit ) {
            if ( q( tid( id ))) {
                await settle( 90 );
                return true;
            }
            await sleep( 80 );
        }
        return false;
    },

    async waitGone( id, ms = 8000 ) {
        const limit = Date.now() + ms;
        while ( Date.now() < limit ) {
            if ( !q( tid( id ))) {
                await settle( 60 );
                return true;
            }
            await sleep( 80 );
        }
        return false;
    },

    async waitSnapshot( predicateName, expected, ms = 12000 ) {
        const limit = Date.now() + ms;
        while ( Date.now() < limit ) {
            const snap = snapshot();
            // eslint-disable-next-line valid-typeof
            if ( snap[ predicateName ] === expected ) {
                return true;
            }
            await sleep( 80 );
        }
        return false;
    },

    /** real in-page click on a probe target (never throws when the target is absent) */
    click( id ) {
        const el = q( tid( id ));
        if ( !el ) {
            return false;
        }
        el.click();
        return true;
    },

    async clickAndSettle( id, ms = 120 ) {
        const ok = X.click( id );
        await settle( ms );
        return ok;
    },

    doubleClick( id ) {
        const el = q( tid( id ));
        if ( !el ) {
            return false;
        }
        el.dispatchEvent( new MouseEvent( "dblclick", { bubbles: true, cancelable: true }));
        return true;
    },

    /** synthetic hardware shortcut: keyCode is what the application switches on */
    async key( code, opts = {} ) {
        window.dispatchEvent( keyEvent( "keydown", code, opts ));
        await sleep( 10 );
        window.dispatchEvent( keyEvent( "keyup", code, opts ));
        await settle( 70 );
        return true;
    },

    /** range slider: fires the same input event v-model.number listens to */
    async setRange( id, value ) {
        const el = rangeOf( id );
        if ( !el ) {
            return false;
        }
        el.value = String( value );
        el.dispatchEvent( new Event( "input", { bubbles: true }));
        el.dispatchEvent( new Event( "change", { bubbles: true }));
        await settle( 90 );
        return true;
    },

    /** number / text input: fires input (v-model) and change (@change handlers) */
    async setInput( id, value ) {
        const el = q( tid( id ));
        if ( !el ) {
            return false;
        }
        el.value = String( value );
        el.dispatchEvent( new Event( "input", { bubbles: true }));
        el.dispatchEvent( new Event( "change", { bubbles: true }));
        await settle( 90 );
        return true;
    },

    /** vue-select: the toggle opens on mousedown, the option list is appended to body */
    async pickOption( id, label, ms = 8000 ) {
        const wrap = q( tid( id ));
        if ( !wrap ) {
            return false;
        }
        const toggle = wrap.querySelector( ".vs__dropdown-toggle" );
        if ( !toggle ) {
            return false;
        }
        toggle.dispatchEvent( new MouseEvent( "mousedown", { bubbles: true, cancelable: true }));
        const limit = Date.now() + ms;
        while ( Date.now() < limit ) {
            const hit = qa( ".vs__dropdown-option" )
                .find( option => ( option.textContent || "" ).trim() === label );
            if ( hit ) {
                hit.dispatchEvent( new MouseEvent( "click", { bubbles: true, cancelable: true }));
                await settle( 120 );
                return true;
            }
            await sleep( 60 );
        }
        return false;
    },

    // ---------------------------------------------------------------- fixtures

    /** creates a document through the application's own factory + store mutation */
    async newDocument( props = {} ) {
        if ( !STORE ) {
            return false;
        }
        STORE.commit( "addNewDocument", DocumentFactory.create({
            name   : props.name   ?? "Fixture document",
            width  : props.width  ?? 320,
            height : props.height ?? 240,
            type   : props.type   ?? "default",
            meta   : props.meta,
        }));
        await settle( 220 );
        return true;
    },

    /** adds a layer through the application's own store mutation */
    async addLayer( name, props = {} ) {
        if ( !STORE ) {
            return false;
        }
        STORE.commit( "addLayer", { name, ...props });
        await settle( 160 );
        return true;
    },

    async selectLayer( index ) {
        if ( !STORE ) {
            return false;
        }
        STORE.commit( "setActiveLayerIndex", index );
        await settle( 140 );
        return true;
    },

    async setActiveTool( tool ) {
        if ( !STORE ) {
            return false;
        }
        STORE.commit( "setActiveTool", { tool, document: STORE.getters.activeDocument });
        await settle( 140 );
        return true;
    },

    /**
     * Expands the toolbox and both side panels. bitmappery.vue created() commits
     * setToolboxOpened( true ) unconditionally but calls closeOpenedPanels() when
     * isMobile() (screen.availWidth <= 640); the toolbox content and the layer list
     * both live inside v-if="!collapsed", so a collapsed panel means the probes are
     * absent rather than merely hidden. setOpenedPanel TOGGLES, so membership is
     * checked before committing. Setup-only.
     */
    async ensureChrome() {
        if ( !STORE ) {
            return false;
        }
        if ( !STORE.state.toolboxOpened ) {
            STORE.commit( "setToolboxOpened", true );
        }
        const opened = STORE.state.openedPanels || [];
        if ( opened.indexOf( PANEL_TOOL_OPTIONS ) === -1 ) {
            STORE.commit( "setOpenedPanel", PANEL_TOOL_OPTIONS );
        }
        if (( STORE.state.openedPanels || []).indexOf( PANEL_LAYERS ) === -1 ) {
            STORE.commit( "setOpenedPanel", PANEL_LAYERS );
        }
        await settle( 140 );
        await X.waitTestid( "tool-brush", 8000 );
        await settle( 90 );
        return true;
    },

    /** direct store write of one tool option, used to pin a baseline before a shortcut */
    async setToolOption( tool, option, value ) {
        if ( !STORE ) {
            return false;
        }
        STORE.commit( "setToolOptionValue", { tool, option, value });
        await settle( 120 );
        return true;
    },

    /** drops every persisted key so each checkpoint starts from a clean storage state */
    clearStorage() {
        try {
            window.localStorage.clear();
            window.sessionStorage.clear();
        } catch {
            // non blocking
        }
        return true;
    },

    seedPreferences( prefs ) {
        try {
            window.localStorage.setItem( PREF_KEY, JSON.stringify( prefs ));
        } catch {
            return false;
        }
        return true;
    },

    /** the application's own preference writer, used to check the persist path */
    async storePreferences() {
        if ( !STORE ) {
            return false;
        }
        await STORE.dispatch( "storePreferences" );
        await settle( 120 );
        return true;
    },

    async resetEditor() {
        if ( !STORE ) {
            return false;
        }
        const docs = STORE.state.document.documents.slice();
        for ( let i = docs.length - 1; i >= 0; --i ) {
            STORE.commit( "setActiveDocument", i );
            STORE.commit( "closeActiveDocument" );
        }
        STORE.commit( "setActiveTool", { tool: null, document: null });
        STORE.commit( "clearNotifications" );
        STORE.commit( "closeDialog" );
        if ( STORE.state.modal !== null ) {
            STORE.commit( "closeModal" );
        }
        await settle( 180 );
        return true;
    },

    // ------------------------------------------------------- frozen measurements

    /** freezes a scalar measured in setup so no assertion reads a live clock/counter */
    freeze( key, value ) {
        window.__BMPF__[ key ] = value;
        return value;
    },

    freezeFromSnapshot( prefix ) {
        const snap = snapshot();
        const bag = {};
        Object.keys( snap ).forEach( key => { bag[ key ] = snap[ key ]; });
        window.__BMPF__[ prefix ] = bag;
        return true;
    },

    clearFrozen() {
        Object.keys( window.__BMPF__ ).forEach( key => { delete window.__BMPF__[ key ]; });
        return true;
    },

    async sleep( ms ) {
        await sleep( ms );
        return true;
    },
};

export function installProbe( store, app ) {
    STORE = store;
    BOOT_GLOBALS = probeGlobals();
    window.__BMPF__ = window.__BMPF__ || {};
    window.__BMPQ__ = snapshot;
    window.__BMPX__ = X;
    window.__BMP_STORE__ = store;
    window.__BMP_APP__ = app;
    // re-measure the boot baseline after our own globals exist so the residue
    // guard only reports globals planted AFTER the probe was installed
    BOOT_GLOBALS = probeGlobals();
    return true;
}
