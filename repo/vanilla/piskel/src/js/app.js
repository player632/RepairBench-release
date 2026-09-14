/**
 * @require Constants
 * @require Events
 */
(function () {
  var ns = $.namespace("pskl");
  /**
   * Main application controller
   */
  ns.app = {
    init: function () {
      /**
       * When started from APP Engine, appEngineToken_ (Boolean) should be set on window.pskl
       */
      this.isAppEngineVersion = !!pskl.appEngineToken_;

      // This id is used to keep track of sessions in the BackupService.
      this.sessionId = pskl.utils.Uuid.generate();

      this.shortcutService = new pskl.service.keyboard.ShortcutService();
      this.shortcutService.init();

      var size = pskl.UserSettings.get(pskl.UserSettings.DEFAULT_SIZE);
      var fps = Constants.DEFAULT.FPS;
      var descriptor = new pskl.model.piskel.Descriptor("New Piskel", "");
      var piskel = new pskl.model.Piskel(
        size.width,
        size.height,
        fps,
        descriptor
      );

      var layer = new pskl.model.Layer("Layer 1");
      var frame = new pskl.model.Frame(size.width, size.height);

      layer.addFrame(frame);
      piskel.addLayer(layer);

      this.corePiskelController = new pskl.controller.piskel.PiskelController(
        piskel
      );
      this.corePiskelController.init();

      this.piskelController = new pskl.controller.piskel.PublicPiskelController(
        this.corePiskelController
      );
      this.piskelController.init();

      this.paletteImportService =
        new pskl.service.palette.PaletteImportService();
      this.paletteImportService.init();

      this.paletteService = new pskl.service.palette.PaletteService();
      this.paletteService.addDynamicPalette(
        new pskl.service.palette.CurrentColorsPalette()
      );

      this.selectedColorsService = new pskl.service.SelectedColorsService();
      this.selectedColorsService.init();

      this.mouseStateService = new pskl.service.MouseStateService();
      this.mouseStateService.init();

      this.paletteController = new pskl.controller.PaletteController();
      this.paletteController.init();

      this.currentColorsService = new pskl.service.CurrentColorsService(
        this.piskelController
      );
      this.currentColorsService.init();

      this.palettesListController = new pskl.controller.PalettesListController(
        this.currentColorsService
      );
      this.palettesListController.init();

      this.cursorCoordinatesController =
        new pskl.controller.CursorCoordinatesController(this.piskelController);
      this.cursorCoordinatesController.init();

      this.drawingController = new pskl.controller.DrawingController(
        this.piskelController,
        document.querySelector("#drawing-canvas-container")
      );
      this.drawingController.init();

      this.previewController = new pskl.controller.preview.PreviewController(
        this.piskelController,
        document.querySelector("#animated-preview-canvas-container")
      );
      this.previewController.init();

      this.minimapController = new pskl.controller.MinimapController(
        this.piskelController,
        this.previewController,
        this.drawingController,
        document.querySelector(".minimap-container")
      );
      this.minimapController.init();

      this.framesListController = new pskl.controller.FramesListController(
        this.piskelController,
        document.querySelector("#preview-list-wrapper")
      );
      this.framesListController.init();

      this.layersListController = new pskl.controller.LayersListController(
        this.piskelController
      );
      this.layersListController.init();

      this.settingsController = new pskl.controller.settings.SettingsController(
        this.piskelController
      );
      this.settingsController.init();

      this.dialogsController = new pskl.controller.dialogs.DialogsController(
        this.piskelController
      );
      this.dialogsController.init();

      this.toolController = new pskl.controller.ToolController();
      this.toolController.init();

      this.selectionManager = new pskl.selection.SelectionManager(
        this.piskelController
      );
      this.selectionManager.init();

      this.historyService = new pskl.service.HistoryService(
        this.piskelController
      );
      this.historyService.init();

      this.notificationController =
        new pskl.controller.NotificationController();
      this.notificationController.init();

      this.transformationsController =
        new pskl.controller.TransformationsController();
      this.transformationsController.init();

      this.progressBarController = new pskl.controller.ProgressBarController();
      this.progressBarController.init();

      this.canvasBackgroundController =
        new pskl.controller.CanvasBackgroundController();
      this.canvasBackgroundController.init();

      this.indexedDbStorageService =
        new pskl.service.storage.IndexedDbStorageService(this.piskelController);
      this.indexedDbStorageService.init();

      this.localStorageService = new pskl.service.storage.LocalStorageService(
        this.piskelController
      );
      this.localStorageService.init();

      this.fileDownloadStorageService =
        new pskl.service.storage.FileDownloadStorageService(
          this.piskelController
        );
      this.fileDownloadStorageService.init();

      this.desktopStorageService =
        new pskl.service.storage.DesktopStorageService(this.piskelController);
      this.desktopStorageService.init();

      this.galleryStorageService =
        new pskl.service.storage.GalleryStorageService(this.piskelController);
      this.galleryStorageService.init();

      this.storageService = new pskl.service.storage.StorageService(
        this.piskelController
      );
      this.storageService.init();

      this.importService = new pskl.service.ImportService(
        this.piskelController
      );
      this.importService.init();

      this.savedStatusService = new pskl.service.SavedStatusService(
        this.piskelController,
        this.historyService
      );
      this.savedStatusService.init();

      this.backupService = new pskl.service.BackupService(
        this.piskelController
      );
      this.backupService.init();

      this.beforeUnloadService = new pskl.service.BeforeUnloadService(
        this.piskelController
      );
      this.beforeUnloadService.init();

      this.headerController = new pskl.controller.HeaderController(
        this.piskelController,
        this.savedStatusService
      );
      this.headerController.init();

      this.penSizeService = new pskl.service.pensize.PenSizeService();
      this.penSizeService.init();

      this.penSizeController = new pskl.controller.PenSizeController();
      this.penSizeController.init();

      this.fileDropperService = new pskl.service.FileDropperService(
        this.piskelController
      );
      this.fileDropperService.init();

      this.userWarningController = new pskl.controller.UserWarningController(
        this.piskelController
      );
      this.userWarningController.init();

      this.performanceReportService =
        new pskl.service.performance.PerformanceReportService(
          this.piskelController,
          this.currentColorsService
        );
      this.performanceReportService.init();

      this.clipboardService = new pskl.service.ClipboardService(
        this.piskelController
      );
      this.clipboardService.init();

      this.drawingLoop = new pskl.rendering.DrawingLoop();
      this.drawingLoop.addCallback(this.render, this);
      this.drawingLoop.start();

      this.initTooltips_();

      $.subscribe(Events.EXTERNAL_PISKEL_READY, function () {
        const externalPiskel = window._externalPiskel;
        if (!externalPiskel) {
          console.error("No external piskel found");
          return;
        }
        pskl.utils.serialization.Deserializer.deserialize(
          externalPiskel,
          function (piskel) {
            pskl.app.piskelController.setPiskel(piskel);
          }
        );
      });

      if (pskl.devtools) {
        pskl.devtools.init();
      }

      if (
        pskl.utils.Environment.detectNodeWebkit() &&
        pskl.utils.UserAgent.isMac
      ) {
        var gui = require("nw.gui");
        var mb = new gui.Menu({ type: "menubar" });
        mb.createMacBuiltin("Piskel");
        gui.Window.get().menu = mb;
      }

      if (
        !pskl.utils.Environment.isIntegrationTest() &&
        pskl.utils.UserAgent.isUnsupported()
      ) {
        $.publish(Events.DIALOG_SHOW, {
          dialogId: "unsupported-browser"
        });
      }

      this.initWlbStateProbe_();
    },

    // TODO: Remove this method and connected code.
    isLoggedIn: function () {
      return false;
    },

    /**
     * WLB instrumentation: read-only state probe. Polls real service state
     * every 200ms and mirrors it as data-* attributes on #wlb-state-probe.
     * Deliberately never subscribes to application events: the event graph
     * is part of the surface under test.
     */
    initWlbStateProbe_: function () {
      var probeEl = document.getElementById("wlb-state-probe");
      if (!probeEl) {
        return;
      }

      var fnv1a = function (bytes) {
        var hash = 0x811c9dc5;
        for (var i = 0; i < bytes.length; i++) {
          hash ^= bytes[i];
          hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
        }
        return ("00000000" + hash.toString(16)).slice(-8);
      };

      var lastPreviewUrl = "";
      var previewBusy = false;

      var readCanvasHash = function (pc, set) {
        var frame = pc.getCurrentFrame();
        if (!frame) {
          return;
        }
        var pixels = frame.getPixels();
        var bytes = new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.length * 4);
        set("data-canvas-hash", fnv1a(bytes) + "-" + frame.getWidth() + "x" + frame.getHeight());
      };

      var readPreviewHash = function (app, pc, set) {
        var container = document.querySelector(
          "#animated-preview-canvas-container .background-image-frame-container"
        );
        if (!container) {
          return;
        }
        var match = (container.style.backgroundImage || "").match(/^url\((.*)\)$/);
        var url = match ? match[1] : "";
        url = url.replace(/^["']|["']$/g, "");
        if (!url || url === lastPreviewUrl || previewBusy) {
          return;
        }
        lastPreviewUrl = url;
        previewBusy = true;
        var image = new Image();
        image.onload = function () {
          try {
            var width = pc.getWidth();
            var height = pc.getHeight();
            var zoom = app.previewController.renderer.getZoom();
            var canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            var context = canvas.getContext("2d");
            context.drawImage(image, 0, 0);
            var data = context.getImageData(0, 0, canvas.width, canvas.height).data;
            var grid = new Uint8Array(width * height * 4);
            for (var y = 0; y < height; y++) {
              for (var x = 0; x < width; x++) {
                var sx = Math.min(Math.floor((x + 0.5) * zoom), canvas.width - 1);
                var sy = Math.min(Math.floor((y + 0.5) * zoom), canvas.height - 1);
                var si = (sy * canvas.width + sx) * 4;
                var di = (y * width + x) * 4;
                grid[di] = data[si];
                grid[di + 1] = data[si + 1];
                grid[di + 2] = data[si + 2];
                grid[di + 3] = data[si + 3];
              }
            }
            set("data-preview-hash", fnv1a(grid) + "-" + width + "x" + height);
          } catch (error) {
            // keep the previously captured value
          }
          previewBusy = false;
        };
        image.onerror = function () {
          previewBusy = false;
          lastPreviewUrl = "";
        };
        image.src = url;
      };

      var updateProbe = function () {
        try {
          if (!pskl.app.piskelController || !pskl.app.toolController) {
            return;
          }
          var app = pskl.app;
          var pc = app.piskelController;
          var set = function (name, value) {
            probeEl.setAttribute(name, String(value));
          };

          set("data-tool", app.toolController.currentSelectedTool ? app.toolController.currentSelectedTool.toolId : "");
          set("data-pen-size", app.penSizeService.getPenSize());
          set("data-primary-color", app.selectedColorsService.getPrimaryColor());
          set("data-secondary-color", app.selectedColorsService.getSecondaryColor());
          set("data-fps", pc.getFPS());
          set("data-frame-index", pc.getCurrentFrameIndex());
          set("data-frame-count", pc.getFrameCount());
          set("data-layer-index", pc.getCurrentLayerIndex());
          set("data-layer-count", pc.getLayers().length);
          set("data-zoom", app.drawingController.compositeRenderer.getZoom().toFixed(2));
          set("data-canvas-width", pc.getWidth());
          set("data-canvas-height", pc.getHeight());
          set("data-onion-skin", pskl.UserSettings.get(pskl.UserSettings.ONION_SKIN));
          set("data-grid", pskl.UserSettings.get(pskl.UserSettings.GRID_ENABLED));
          set("data-layer-preview", pskl.UserSettings.get(pskl.UserSettings.LAYER_PREVIEW));
          set("data-preview-size", pskl.UserSettings.get(pskl.UserSettings.PREVIEW_SIZE));
          set("data-seamless", pskl.UserSettings.get(pskl.UserSettings.SEAMLESS_MODE));
          set("data-dirty", app.savedStatusService.isDirty());
          set("data-piskel-name", pc.getPiskel().getDescriptor().name);
          set("data-dialog", app.dialogsController.currentDialog_ ? app.dialogsController.currentDialog_.id : "none");
          set("data-drawer", app.settingsController.currentSetting || "none");
          set("data-history-index", app.historyService.currentIndex);
          set("data-history-length", app.historyService.stateQueue.length);
          set("data-prompt-count", window.__wlbPromptCalls || 0);
          var layer = pc.getCurrentLayer();
          set("data-layer-opacity", layer ? layer.getOpacity() : "");
          readCanvasHash(pc, set);
          readPreviewHash(app, pc, set);
        } catch (error) {
          // the probe must never break the application
        }
      };

      window.setInterval(updateProbe, 200);
      updateProbe();
    },

    initTooltips_: function () {
      $("body").tooltip({
        selector: "[rel=tooltip]"
      });
    },

    render: function (delta) {
      this.drawingController.render(delta);
      this.previewController.render(delta);
      this.framesListController.render(delta);
    },

    getFirstFrameAsPng: function () {
      var frame = pskl.utils.LayerUtils.mergeFrameAt(
        this.piskelController.getLayers(),
        0
      );
      var canvas;
      if (frame instanceof pskl.model.frame.RenderedFrame) {
        canvas = pskl.utils.CanvasUtils.createFromImage(
          frame.getRenderedFrame()
        );
      } else {
        canvas = pskl.utils.FrameUtils.toImage(frame);
      }
      return canvas.toDataURL("image/png");
    },

    getFramesheetAsPng: function () {
      var renderer = new pskl.rendering.PiskelRenderer(this.piskelController);
      var framesheetCanvas = renderer.renderAsCanvas();
      return framesheetCanvas.toDataURL("image/png");
    }
  };
})();
