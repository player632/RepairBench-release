/**
 * KeyboardLab translations — separate from main eletypes translations.
 *
 * Uses the global locale preference from LocaleContext.
 */

export const labTranslations = {
  en: {
    // Roadmap
    lab_roadmap: "Roadmap",
    lab_roadmap_title: "Keyboard Lab Roadmap",
    lab_roadmap_subtitle: "Beta — here's what we're building",
    lab_roadmap_done: "Shipped",
    lab_roadmap_next: "Coming Next",
    lab_roadmap_future: "On the Horizon",
    lab_roadmap_done_items: [
      "3D keyboard visualization with spring animation",
      "8 keycap profiles: Cherry, OEM, SA, MT3, KAT, DSA, XDA, Low Profile",
      "7 layouts: 60%, 65%, HHKB 60%, 75%, TKL, Full-size, Cyberboard R2",
      "6 legend presets with live editing + position schema (safe inset, no overflow)",
      "Parametric case profile editor with 2D → 3D extrusion",
      "Colored edge accent strips (LED-style glow)",
      "Per-group opacity: keycap, accent, case, legend",
      "Design bundle schema for local save/export/import",
      "KLE layout import — paste raw data or drop a .json file",
      "Bento card UI — collapsible per-asset cards with Config / JSON / Doc tabs",
      "Render-style schema (eletypes-renderStyle/1) — 8 modes: PBR, cel-hard toon + outline, lofi-flat, blueprint, x-ray, neon, risograph, pixel",
      "Per-scope render styles — keycap and case can pick independent looks",
      "Floating viewer overlay — background variants (solid / gradient / studio / stars / grid 2D & 3D), fog, FOV, ground shadow",
      "9 color themes including le smoking",
      "Bidirectional JSON schema editor with documentation",
      "English & Chinese localization",
    ],
    lab_roadmap_next_items: [
      "[P0] Online cloud save — upload & download designs",
      "[P1] Community gallery — browse, share & remix designs",
      "[P2] Drag & drop 2D layout editor — reposition keys freely",
      "[P3] Spline & Bézier curves for case profile sculpting — smooth organic shapes, not just straight segments",
      "[P4] Eletypes typing test animation integration",
      "[P5] Painterly render mode + layer blend (riso × cel etc.)",
    ],
    lab_roadmap_future_items: [
      "Stickers & decals on keycaps and case",
      "More visual effects: LED underglow, RGB lighting",
      "VIA layout import converter",
      "Extract core engine as @eletypes/keyboard-lab npm package — embed 3D keyboard visualization in any web app",
    ],

    // Editor's note
    lab_editors_note_title: "From the maker",
    lab_editors_note: `Eletypes started as a typing tool I wanted for myself — open source, free, no signup, no ads.

Keyboard Lab is the wilder experiment: get the cost of designing a keyboard down to opening a browser tab — no Blender, no Fusion 360. Pick a layout, drag a few points, pick some colors, watch it come alive in 3D. The designs are rough, still beta, but we're not here to compete with CAD — we're here to play.

Solo project — your feedback drives what's next. If you're up for tinkering together, find me on GitHub.

Thanks for typing with me.`,
    lab_editors_note_link: "https://github.com/gamer-ai/eletype-frontend/",
    lab_editors_note_link_text: "find me on GitHub",

    // Page nav
    lab_title: "Keyboard Lab",
    lab_return: "Return",
    lab_theme: "Theme",
    lab_language: "Language",

    // Toolbar
    lab_new: "New",
    lab_save: "Save",
    lab_saved: "Saved",
    lab_saved_count: "Saved ({0})",
    lab_reload: "Reload",
    lab_delete: "Delete",
    lab_export: "Export",
    lab_import: "Import",
    lab_import_kle: "+ KLE",
    lab_import_kle_tooltip: "Import layout from KLE (keyboard-layout-editor.com)",
    lab_import_kle_hint: "Paste KLE raw data (rows JSON) from the \"Raw data\" tab of {0}, or drop a .json file onto the editor. Then click Convert.",
    lab_import_kle_hint_link: "keyboard-layout-editor.com",
    lab_import_kle_drop_hint: "Paste KLE raw data here, or drop a .json file",
    lab_import_kle_failed: "Conversion failed —",
    lab_import_kle_empty: "Paste KLE data or drop a file first.",
    lab_import_kle_read_failed: "Couldn't read that file.",
    lab_import_kle_chars: "{0} chars",
    lab_convert: "Convert",
    lab_cancel: "Cancel",
    lab_demo: "Key Animation",
    lab_live_on: "Key Listen: ON",
    lab_live_off: "Key Listen: OFF",
    lab_saved_msg: "Saved!",
    lab_clear_all: "Clear All",
    lab_import_failed: "Import failed: {0}",
    lab_untitled: "Untitled Design",
    lab_loading: "Loading…",

    // Section titles
    lab_assets: "Assets",
    lab_legend_section: "Legend",
    lab_colors_section: "Colors",
    lab_keycap_mount: "Keycap Mount",

    // Asset labels
    lab_layout: "Layout",
    lab_shell: "Shell",
    lab_keycap: "Keycap",
    lab_legend: "Legend",
    lab_profile: "Profile",
    lab_theme: "Theme",

    // Legend controls
    lab_size: "Size",
    lab_weight: "Weight",
    lab_font: "Font",
    lab_color: "Color",
    lab_light: "Light",
    lab_semi: "Semi",
    lab_bold: "Bold",

    // Color/Opacity labels
    lab_keycap_color: "Keycap",
    lab_accent_color: "Accent",
    lab_case_color: "Case",
    lab_label_opacity: "Label",

    // Editor tabs
    lab_tab_case_profile: "Case Profile",
    lab_tab_2d_layout: "2D Layout",
    lab_tab_config: "Config",
    lab_tab_json: "JSON",
    lab_tab_2d: "2D",
    lab_collapse: "Collapse",
    lab_expand: "Expand",
    lab_refs: "References",
    lab_opacity: "Opacity",
    lab_legend_position: "Position",
    lab_legend_inset: "Inset",
    lab_pos_center: "Center",
    lab_pos_top_left: "Top Left",
    lab_pos_top_right: "Top Right",
    lab_pos_bottom_left: "Bottom Left",
    lab_pos_bottom_right: "Bottom Right",
    lab_pos_top_center: "Top Center",
    lab_pos_bottom_center: "Bottom Center",
    lab_tab_style: "Style",
    lab_style_preset: "Preset",
    lab_style_mode: "Mode",
    lab_style_steps: "Steps",
    lab_style_outline: "Outline",
    lab_style_case_scope: "Case style",
    lab_style_inherit: "Inherit from global",
    lab_style_inherit_note: "This scope inherits the global style. Pick a preset above to override it.",
    lab_style_glow: "Glow",
    lab_scope_global: "Global",
    lab_scope_keycap: "Keycap",
    lab_scope_case: "Case",
    lab_advanced: "Advanced",
    lab_hide: "Hide",
    lab_style_mode_note: "Overrides the preset's built-in mode. Most presets already map to a mode — leave alone unless you need a custom combo.",
    lab_tab_viewer: "Viewer",
    lab_viewer_bg: "Background",
    lab_viewer_lighting: "Lighting",
    lab_viewer_depth: "Depth",
    lab_viewer_bg_type: "Type",
    lab_viewer_bg_color: "Color",
    lab_viewer_bg_top: "Top",
    lab_viewer_bg_bottom: "Bottom",
    lab_viewer_bg_base: "Base",
    lab_viewer_bg_lines: "Lines",
    lab_viewer_bg_solid: "Solid",
    lab_viewer_bg_gradient: "Gradient",
    lab_viewer_bg_studio: "Studio",
    lab_viewer_bg_stars: "Stars",
    lab_viewer_bg_grid: "Grid",
    lab_viewer_grid_3d: "3D grid",
    lab_viewer_grid_3d_note: "Perspective floor",
    lab_viewer_star_count: "Star count",
    lab_viewer_ambient: "Ambient",
    lab_viewer_key_light: "Key light",
    lab_viewer_fov: "FOV",
    lab_viewer_fog: "Fog",
    lab_viewer_shadow: "Ground shadow",
    lab_viewer_note: "Observer-side only — not saved in the design doc.",
    lab_doc_style: `Render Style (eletypes-renderStyle/1)
Visual pipeline layer — orthogonal to layout / keycap / legend / shell / caseProfile.

mode — Single identifier or 2-tuple for layer blend
  pbr         Physically-based (default)
  cel-hard    Toon shaded + back-face outline
  lofi-flat   Unlit flat color
  risograph   (soon) Print offset + dither
  painterly   (soon) Brush texture
  pixel       (soon) Resolution downsample
  blueprint   (soon) Technical drawing
  x-ray       (soon) Transparent wireframe

cel — Toon-shading parameters
  gradientSteps: 2–6 banded shading tiers
  outlineWidth: 0–0.2 back-face expansion
  outlineColor: Hex color of the outline
  shadowColor:  Hex color of the dark band

Per-key override uses _renderOverride:
  { "id": "Space", "_renderOverride": { "cel": { "outlineColor": "#ff0000" } } }`,

    // JSON tabs
    lab_tab_design: "Design",
    lab_tab_layout: "Layout",
    lab_tab_keycap: "Keycap",
    lab_tab_legend: "Legend",
    lab_tab_shell: "Shell",
    lab_tab_case_profile_json: "Case Profile",

    // Mount controls
    lab_fit: "Fit",
    lab_scale: "Scale",
    lab_reset: "Reset",

    // Doc tab
    lab_tab_doc: "Doc",
    lab_doc_title: "Schema Reference",
    lab_doc_design: `Design Document (eletypes-design/1)
The orchestrator document. References all assets by ref string and stores user overrides.

refs — Asset references in "{type}/{id}@{version}" format
  layout: Required. Keyboard layout ref
  keycap: Keycap profile ref
  legend: Legend style ref
  shell: Case shell ref
  caseProfile: Case cross-section profile ref

overrides.visual — Color overrides
  keycapColor: Hex color for regular keycaps
  accentKeyColor: Hex color for accent keycaps
  caseColor: Hex color for case body

overrides.opacity — Per-group opacity (0-1)
  keycap, accent, case, legend

overrides.legend — Legend text overrides
  color, fontSize, fontWeight, fontFamily`,

    lab_doc_layout: `Layout (eletypes-kbd/1)
Defines the physical key placement on the board.

meta.name: Board name
meta.formFactor: "75%", "65%", "TKL", etc.
meta.layoutType: "row-staggered", "ortho", "ergo"

layout.keys[] — Array of key objects:
  id: Unique key identifier (e.g. "KeyA", "Enter")
  x, y: Position in key units (1u = 1 standard key)
  w: Width in key units (default 1)
  h: Height in key units (default 1)
  label: Display text on keycap
  kind: "alpha" | "mod" | "accent" | "fn" | "nav" | "arrow"
  code: KeyboardEvent.code for live typing`,

    lab_doc_keycap: `Keycap Profile (eletypes-cap/1)
Defines keycap geometry: shape, height, dish type.

profile.family: Profile name ("Cherry", "SA", "DSA", "XDA")
profile.uniform: true if all rows share the same height
profile.rows: Per-row height scaling { 0: {height: 1.0}, ... }

profile.defaultCap:
  height: Base cap height
  topScale: Top surface size relative to base (0-1)
  dishDepth: Depth of the dish concavity
  dishType: "cylindrical" | "spherical" | "flat"`,

    lab_doc_legend: `Legend Style (eletypes-legend/1)
Controls the text rendered on each keycap.

style:
  fontSize: Text size (8-40)
  fontWeight: 400 (light), 600 (semi), 700 (bold)
  fontFamily: Font face string
  color: Hex color for legend text
  uppercase: Force single-char labels to uppercase

keyOverrides: Per-key label/color overrides
  { "KeyA": { label: "A", color: "#fff" } }`,

    lab_doc_shell: `Shell (eletypes-shell/1)
Defines the case body geometry.

case:
  height: Case body height
  cornerRadius: Rounded corner radius
  paddingTop/Bottom/Left/Right: Space around the key field
  tilt: Angle in degrees (0 = flat, >0 = back-high wedge)

plate:
  thickness: Switch plate thickness
  material: "aluminum", "brass", "polycarbonate"`,

    lab_doc_caseProfile: `Case Profile (eletypes-caseProfile/1)
2D cross-section of the case, extruded symmetrically into 3D.

caseProfile.points[] — Polygon vertices:
  x: 0 (front) to 100 (back)
  y: Height (0 = bottom, up to 60)
  d: Width inset at this vertex (symmetric, for chamfers)

caseProfile.mountEdge: [fromIdx, toIdx]
  The edge where keycaps mount. Click an edge in the SVG editor to set.

caseProfile.coloredEdges[] — Accent edge strips:
  from, to: Point indices
  color: Hex color
  emissive: Glow intensity 0-1

mount — Keycap placement settings:
  offset: { x, y, z } position adjustment
  fit: How much of the mount edge keys occupy (0.4-1.5)
  caseScale: Overall case size multiplier
  extrudeWidth: Case width multiplier (symmetric)`,

    // Case profile editor
    lab_front: "Front",
    lab_back: "Back",
    lab_extrusion_width: "Extrusion Width",
    lab_extrusion_title: "Width of the extruded case. The cross-section above is extruded symmetrically in both directions along the width axis.",
    lab_symmetric: "symmetric ←→",
    lab_taller: "↑ Taller",
    lab_shorter: "↓ Shorter",
    lab_points: "Points",
    lab_inset: "inset",
    lab_remove_point: "Remove point",
    lab_edge_accents: "Edge Accents",
    lab_remove_accent: "Remove accent",
    lab_help_text: "Drag points · Double-click edge to add · Right-click to remove · Click edge to set mount · Inset narrows width at vertex (symmetric)",
  },

  zh: {
    // Toolbar
    // Roadmap
    lab_roadmap: "开发计划",
    lab_roadmap_title: "键盘实验室开发计划",
    lab_roadmap_subtitle: "Beta 版 — 我们正在打造的功能",
    lab_roadmap_done: "已上线",
    lab_roadmap_next: "即将推出",
    lab_roadmap_future: "远期规划",
    lab_roadmap_done_items: [
      "3D 键盘可视化，弹簧按键动画",
      "8 种键帽轮廓：Cherry、OEM、SA、MT3、KAT、DSA、XDA、矮轴",
      "7 种布局：60%、65%、HHKB 60%、75%、TKL、全尺寸、Cyberboard R2",
      "6 种字符预设，支持实时编辑 + 位置 Schema（安全边距，不溢出键帽）",
      "参数化外壳轮廓编辑器，2D → 3D 挤出",
      "彩色边缘装饰条（LED 发光效果）",
      "分组透明度控制：键帽、重点键、外壳、字符",
      "设计包 Schema，支持本地保存/导出/导入",
      "KLE 布局导入 — 粘贴原始数据或拖入 .json 文件",
      "Bento 卡片 UI — 可折叠的资源卡片，各自拥有配置 / JSON / 文档 标签页",
      "渲染风格 Schema（eletypes-renderStyle/1）—— 8 种模式：PBR、硬切卡通 + 描边、无光照纯色、工程图纸、透视线框、霓虹、Risograph、像素",
      "分作用域渲染风格 — 键帽和外壳可以各选各的风格",
      "悬浮取景器面板 — 背景样式（纯色 / 渐变 / 影棚 / 星空 / 网格 2D & 3D）、雾、视角、接地阴影",
      "9 种配色主题，包含 le smoking",
      "双向 JSON Schema 编辑器及文档",
      "中英文界面支持",
    ],
    lab_roadmap_next_items: [
      "[P0] 云端存储 — 上传和下载设计",
      "[P1] 社区画廊 — 浏览、分享和混搭设计",
      "[P2] 拖放式 2D 布局编辑器 — 自由移动按键",
      "[P3] 外壳轮廓支持样条曲线和贝塞尔曲线 — 流畅的有机造型，不再局限于直线段",
      "[P4] Eletypes 打字测试动画集成",
      "[P5] 笔触渲染模式 + 图层混合（riso × cel 等）",
    ],
    lab_roadmap_future_items: [
      "贴纸与键帽/外壳装饰",
      "更多视觉效果：LED 底部灯光、RGB 灯效",
      "VIA 布局导入转换器",
      "将核心引擎抽离为 @eletypes/keyboard-lab npm 包 — 让任何 Web 应用都能嵌入 3D 键盘可视化",
    ],

    // Editor's note
    lab_editors_note_title: "写在前面",
    lab_editors_note: `Eletypes 一开始就是个我自己想用的打字小工具 —— 开源、免费、没账号、没广告。

键盘实验室是更野的实验：把设计一把键盘的成本压到打开一个浏览器标签页 —— 不用 Blender，不用 Fusion 360。挑布局、拖几个点、选几个颜色，看它在你面前变成 3D。设计还很糙，是 beta，但我们不是来和 CAD 较劲的，就是来玩的。

一个人在维护，你的反馈决定下一步做啥。想一起折腾的话，欢迎在 GitHub 上加入。

感谢你和我一起打字。`,
    lab_editors_note_link: "https://github.com/gamer-ai/eletype-frontend/",
    lab_editors_note_link_text: "在 GitHub 上加入",

    // Page nav
    lab_title: "键盘实验室",
    lab_return: "返回",
    lab_theme: "主题",
    lab_language: "语言",

    lab_new: "新建",
    lab_save: "保存",
    lab_saved: "已保存",
    lab_saved_count: "已保存 ({0})",
    lab_reload: "重新加载",
    lab_delete: "删除",
    lab_export: "导出",
    lab_import: "导入",
    lab_import_kle: "+ KLE",
    lab_import_kle_tooltip: "从 KLE (keyboard-layout-editor.com) 导入布局",
    lab_import_kle_hint: "从 {0} 的 \"Raw data\" 标签页复制粘贴 KLE 原始数据（行 JSON），或将 .json 文件拖入编辑器，然后点击转换。",
    lab_import_kle_hint_link: "keyboard-layout-editor.com",
    lab_import_kle_drop_hint: "在此粘贴 KLE 原始数据，或拖入 .json 文件",
    lab_import_kle_failed: "转换失败 —",
    lab_import_kle_empty: "请先粘贴 KLE 数据或拖入文件。",
    lab_import_kle_read_failed: "文件读取失败。",
    lab_import_kle_chars: "{0} 字符",
    lab_convert: "转换",
    lab_cancel: "取消",
    lab_demo: "按键动画",
    lab_live_on: "按键监听: 开",
    lab_live_off: "按键监听: 关",
    lab_saved_msg: "已保存！",
    lab_clear_all: "清除全部",
    lab_import_failed: "导入失败：{0}",
    lab_untitled: "未命名设计",
    lab_loading: "加载中…",

    // Section titles
    lab_assets: "资源",
    lab_legend_section: "字符",
    lab_colors_section: "颜色",
    lab_keycap_mount: "键帽安装",

    // Asset labels
    lab_layout: "布局",
    lab_shell: "外壳",
    lab_keycap: "键帽",
    lab_legend: "字符",
    lab_profile: "轮廓",
    lab_theme: "主题",

    // Legend controls
    lab_size: "大小",
    lab_weight: "粗细",
    lab_font: "字体",
    lab_color: "颜色",
    lab_light: "细体",
    lab_semi: "中粗",
    lab_bold: "粗体",

    // Color/Opacity labels
    lab_keycap_color: "键帽",
    lab_accent_color: "重点",
    lab_case_color: "外壳",
    lab_label_opacity: "标签",

    // Editor tabs
    lab_tab_case_profile: "外壳轮廓",
    lab_tab_2d_layout: "2D 布局",
    lab_tab_config: "配置",
    lab_tab_json: "JSON",
    lab_tab_2d: "2D",
    lab_collapse: "折叠",
    lab_expand: "展开",
    lab_refs: "引用",
    lab_opacity: "透明度",
    lab_legend_position: "位置",
    lab_legend_inset: "边距",
    lab_pos_center: "居中",
    lab_pos_top_left: "左上",
    lab_pos_top_right: "右上",
    lab_pos_bottom_left: "左下",
    lab_pos_bottom_right: "右下",
    lab_pos_top_center: "上中",
    lab_pos_bottom_center: "下中",
    lab_tab_style: "渲染风格",
    lab_style_preset: "预设",
    lab_style_mode: "模式",
    lab_style_steps: "阶梯数",
    lab_style_outline: "描边",
    lab_style_case_scope: "外壳风格",
    lab_style_inherit: "继承全局",
    lab_style_inherit_note: "当前作用域继承全局风格。在上方选择预设以覆盖。",
    lab_style_glow: "辉光",
    lab_scope_global: "全局",
    lab_scope_keycap: "键帽",
    lab_scope_case: "外壳",
    lab_advanced: "高级",
    lab_hide: "隐藏",
    lab_style_mode_note: "覆盖预设内置的模式。绝大多数预设已与模式一一对应 —— 除非需要自定义组合，否则无需调整。",
    lab_tab_viewer: "取景器",
    lab_viewer_bg: "背景",
    lab_viewer_lighting: "灯光",
    lab_viewer_depth: "景深",
    lab_viewer_bg_type: "类型",
    lab_viewer_bg_color: "颜色",
    lab_viewer_bg_top: "顶色",
    lab_viewer_bg_bottom: "底色",
    lab_viewer_bg_base: "底色",
    lab_viewer_bg_lines: "线色",
    lab_viewer_bg_solid: "纯色",
    lab_viewer_bg_gradient: "渐变",
    lab_viewer_bg_studio: "影棚",
    lab_viewer_bg_stars: "星空",
    lab_viewer_bg_grid: "网格",
    lab_viewer_grid_3d: "3D 网格",
    lab_viewer_grid_3d_note: "透视地面",
    lab_viewer_star_count: "星星数量",
    lab_viewer_ambient: "环境光",
    lab_viewer_key_light: "主光源",
    lab_viewer_fov: "视角",
    lab_viewer_fog: "雾",
    lab_viewer_shadow: "接地阴影",
    lab_viewer_note: "仅影响观察视角 —— 不会写入设计文件。",
    lab_doc_style: `渲染风格（eletypes-renderStyle/1）
视觉管线层 —— 与布局 / 键帽 / 字符 / 外壳 / 外壳剖面 正交。

mode —— 单个标识符，或 2 元组用于图层混合
  pbr         真实感 PBR（默认）
  cel-hard    硬切卡通 + 背面描边
  lofi-flat   无光照纯色
  risograph   （即将）印刷错位 + 噪点抖动
  painterly   （即将）笔触纹理
  pixel       （即将）像素降采样
  blueprint   （即将）工程图纸
  x-ray       （即将）透视线框

cel —— 卡通渲染参数
  gradientSteps: 2–6 阶明暗分段
  outlineWidth: 0–0.2 背面膨胀
  outlineColor: 描边颜色（HEX）
  shadowColor:  阴影色（HEX）

按键级覆盖使用 _renderOverride：
  { "id": "Space", "_renderOverride": { "cel": { "outlineColor": "#ff0000" } } }`,

    // JSON tabs
    lab_tab_design: "设计",
    lab_tab_layout: "布局",
    lab_tab_keycap: "键帽",
    lab_tab_legend: "字符",
    lab_tab_shell: "外壳",
    lab_tab_case_profile_json: "外壳轮廓",

    // Mount controls
    lab_fit: "适配",
    lab_scale: "缩放",
    lab_reset: "重置",

    // Doc tab
    lab_tab_doc: "文档",
    lab_doc_title: "Schema 参考",
    lab_doc_design: `设计文档 (eletypes-design/1)
编排文档。通过 ref 字符串引用所有资源，并存储用户的自定义覆盖。

refs — 资源引用，格式: "{类型}/{id}@{版本}"
  layout: 必填。键盘布局引用
  keycap: 键帽轮廓引用
  legend: 字符样式引用
  shell: 外壳引用
  caseProfile: 外壳截面轮廓引用

overrides.visual — 颜色覆盖
  keycapColor: 普通键帽颜色（十六进制）
  accentKeyColor: 重点键颜色
  caseColor: 外壳颜色

overrides.opacity — 分组透明度 (0-1)
  keycap, accent, case, legend

overrides.legend — 字符文本覆盖
  color, fontSize, fontWeight, fontFamily`,

    lab_doc_layout: `布局 (eletypes-kbd/1)
定义键盘上按键的物理位置。

meta.name: 键盘名称
meta.formFactor: "75%"、"65%"、"TKL" 等
meta.layoutType: "row-staggered"、"ortho"、"ergo"

layout.keys[] — 按键数组:
  id: 唯一标识符（如 "KeyA"、"Enter"）
  x, y: 以键位为单位的位置（1u = 1个标准键）
  w: 宽度（默认 1）
  h: 高度（默认 1）
  label: 键帽显示文字
  kind: "alpha" | "mod" | "accent" | "fn" | "nav" | "arrow"
  code: KeyboardEvent.code，用于实时按键监听`,

    lab_doc_keycap: `键帽轮廓 (eletypes-cap/1)
定义键帽几何形状：外形、高度、凹陷类型。

profile.family: 轮廓名称（"Cherry"、"SA"、"DSA"、"XDA"）
profile.uniform: 如果所有行高度相同则为 true
profile.rows: 每行高度缩放 { 0: {height: 1.0}, ... }

profile.defaultCap:
  height: 基础键帽高度
  topScale: 顶面相对底面的大小 (0-1)
  dishDepth: 凹陷深度
  dishType: "cylindrical" | "spherical" | "flat"`,

    lab_doc_legend: `字符样式 (eletypes-legend/1)
控制每个键帽上渲染的文字。

style:
  fontSize: 文字大小 (8-40)
  fontWeight: 400 (细体), 600 (中粗), 700 (粗体)
  fontFamily: 字体名称
  color: 字符颜色（十六进制）
  uppercase: 单字符标签强制大写

keyOverrides: 每键的标签/颜色覆盖
  { "KeyA": { label: "A", color: "#fff" } }`,

    lab_doc_shell: `外壳 (eletypes-shell/1)
定义外壳主体的几何形状。

case:
  height: 外壳高度
  cornerRadius: 圆角半径
  paddingTop/Bottom/Left/Right: 按键区域周围的间距
  tilt: 倾斜角度（0 = 水平，>0 = 后高前低）

plate:
  thickness: 定位板厚度
  material: "aluminum"、"brass"、"polycarbonate"`,

    lab_doc_caseProfile: `外壳轮廓 (eletypes-caseProfile/1)
外壳的 2D 截面，沿宽度轴对称挤出为 3D。

caseProfile.points[] — 多边形顶点:
  x: 0（前）到 100（后）
  y: 高度（0 = 底部，最高 60）
  d: 该顶点的宽度内缩（对称，用于倒角）

caseProfile.mountEdge: [起点索引, 终点索引]
  键帽安装的边缘。在 SVG 编辑器中点击边缘来设置。

caseProfile.coloredEdges[] — 装饰边缘条:
  from, to: 点索引
  color: 颜色（十六进制）
  emissive: 发光强度 0-1

mount — 键帽放置设置:
  offset: { x, y, z } 位置偏移
  fit: 键帽占安装边缘的比例 (0.4-1.5)
  caseScale: 外壳整体缩放
  extrudeWidth: 外壳宽度倍数（对称）`,

    // Case profile editor
    lab_front: "前",
    lab_back: "后",
    lab_extrusion_width: "挤出宽度",
    lab_extrusion_title: "外壳挤出宽度。上方的截面沿宽度轴对称挤出。",
    lab_symmetric: "对称 ←→",
    lab_taller: "↑ 增高",
    lab_shorter: "↓ 降低",
    lab_points: "控制点",
    lab_inset: "内缩",
    lab_remove_point: "删除控制点",
    lab_edge_accents: "边缘装饰",
    lab_remove_accent: "删除装饰",
    lab_help_text: "拖拽控制点 · 双击边缘添加 · 右键删除 · 点击边缘设为安装面 · 内缩使顶点处宽度变窄（对称）",
  },
};
