<!--
  WlbStateProbe (instrumentation): renders canvas/editor state into hidden DOM nodes
  carrying data-testid anchors so checkpoints can assert canvas state without pixels.
  Display surface only - never mutates canvas/editor state.
-->
<template>
  <div style="display: none" aria-hidden="true">
    <div data-testid="wlb-probe-objcount">{{ probe.objects.length }}</div>
    <div data-testid="wlb-probe-objlist">
      <div v-for="(item, index) in probe.objects" :key="index" data-testid="wlb-probe-obj">
        {{ item.label }}
      </div>
    </div>
    <div data-testid="wlb-probe-selmode">{{ probe.selmode }}</div>
    <div data-testid="wlb-probe-seltype">{{ probe.seltype }}</div>
    <div
      data-testid="wlb-probe-active"
      :data-left="probe.active.left"
      :data-top="probe.active.top"
      :data-angle="probe.active.angle"
      :data-opacity="probe.active.opacity"
      :data-fill="probe.active.fill"
      :data-visible="probe.active.visible"
      :data-flipx="probe.active.flipx"
      :data-flipy="probe.active.flipy"
      :data-text="probe.active.text"
    ></div>
    <div data-testid="wlb-probe-zoom">{{ probe.zoom }}</div>
    <div
      data-testid="wlb-probe-workspace"
      :data-width="probe.workspace.width"
      :data-height="probe.workspace.height"
      :data-fill="probe.workspace.fill"
      :data-vpx="probe.workspace.vpx"
      :data-vpy="probe.workspace.vpy"
    ></div>
    <div data-testid="wlb-probe-history">{{ probe.history }}</div>
    <div
      data-testid="wlb-probe-drawmode"
      :data-drawing="probe.drawing"
      :data-linetype="probe.linetype"
    ></div>
  </div>
</template>

<script setup name="WlbStateProbe">
import { inject, onMounted, reactive } from 'vue';

const fabric = inject('fabric');
const canvasEditor = inject('canvasEditor');

const EMPTY_ACTIVE = {
  left: '0',
  top: '0',
  angle: '0',
  opacity: '100',
  fill: '',
  visible: 'true',
  flipx: 'false',
  flipy: 'false',
  text: '',
};

const probe = reactive({
  objects: [],
  selmode: '',
  seltype: '',
  active: { ...EMPTY_ACTIVE },
  zoom: '0.00',
  workspace: { width: '0', height: '0', fill: '', vpx: '0', vpy: '0' },
  history: '0/0',
  drawing: 'false',
  linetype: '',
});

const round = (v) => String(Math.round(Number(v) || 0));

function refresh() {
  const canvas = canvasEditor.canvas;
  if (!canvas) return;
  const objs = canvas
    .getObjects()
    .filter((item) => !(item instanceof fabric.GuideLine) && item.id !== 'workspace');
  probe.objects = [...objs]
    .reverse()
    .map((o) => ({ label: `${o.type}:${o.name || o.text || ''}` }));
  const active = canvas.getActiveObject();
  if (active && active.type === 'activeSelection') {
    probe.selmode = 'multiple';
    probe.seltype = '';
    probe.active = { ...EMPTY_ACTIVE };
  } else if (active) {
    probe.selmode = 'one';
    probe.seltype = String(active.type);
    probe.active = {
      left: round(active.left),
      top: round(active.top),
      angle: round(active.angle),
      opacity: round((active.opacity ?? 1) * 100),
      fill: String(active.fill ?? ''),
      visible: String(active.visible !== false),
      flipx: String(!!active.flipX),
      flipy: String(!!active.flipY),
      text: String(active.text ?? ''),
    };
  } else {
    probe.selmode = '';
    probe.seltype = '';
    probe.active = { ...EMPTY_ACTIVE };
  }
  probe.zoom = canvas.getZoom().toFixed(2);
  const ws = canvas.getObjects().find((o) => o.id === 'workspace');
  if (ws) {
    const vt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    probe.workspace = {
      width: round(ws.width),
      height: round(ws.height),
      fill: String(ws.fill ?? ''),
      vpx: round(vt[4]),
      vpy: round(vt[5]),
    };
  }
}

onMounted(() => {
  refresh();
  const canvas = canvasEditor.canvas;
  // instrumentation: tag fabric's interactive upper canvas so checkpoints can
  // click/drag the canvas surface (the original #canvas becomes the pointer-events:none
  // lower canvas once fabric wraps it in .canvas-container). Display surface only.
  if (canvas && canvas.upperCanvasEl) {
    canvas.upperCanvasEl.setAttribute('data-testid', 'wlb-canvas-hit');
  }
  [
    'after:render',
    'selection:created',
    'selection:updated',
    'selection:cleared',
    'object:added',
    'object:removed',
    'object:modified',
  ].forEach((ev) => canvas.on(ev, refresh));
  canvasEditor.on('historyUpdate', (undoCount, redoCount) => {
    probe.history = `${undoCount}/${redoCount}`;
  });
  canvasEditor.on('sizeChange', () => refresh());
  canvasEditor.on('loadJson', () => setTimeout(refresh, 50));
  canvasEditor.on('wlbDrawMode', (drawing, linetype) => {
    probe.drawing = String(!!drawing);
    probe.linetype = String(linetype || '');
  });
});
</script>
