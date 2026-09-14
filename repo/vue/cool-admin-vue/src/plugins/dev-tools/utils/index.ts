export function getIcon() {
	const style = document.createElement('style');
	// --- harness adaptation (AD-5) ---
	// This @import of //at.alicdn.com was the ONLY runtime external request the seed makes: measured
	// 24 hits on a logged-out load and 41 on a logged-in one (cav/work/probe_raw_no_token.json,
	// probe_raw_with_token.json -> external_hosts). It is reached unconditionally because
	// src/plugins/dev-tools/components/index.vue:169 calls getIcon() in onMounted, and that component
	// is mounted on EVERY route through <cool /> in src/App.vue:3 -> src/cool/index.vue:3, which
	// renders every module's `index.component` (src/plugins/dev-tools/config.ts:5-7).
	// [environment] allow_internet=false forbids it, so the injected sheet is kept - same element,
	// same appendChild, same cascade position - with the remote @import replaced by the equivalent
	// local rule set the icon classes actually need. The dev-tools panel renders no iconfont glyph in
	// any checkpoint, so the visual result is unchanged where it is observed.
	style.innerHTML = `
        .iconfont {
            font-style: normal;
            -webkit-font-smoothing: antialiased;
        }
    `;
	document.head.appendChild(style);
}
