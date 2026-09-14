<script lang="ts">
	import type Editor from './Editor.svelte';
	import { appState } from '$lib/appState.svelte';

	interface Props {
		editor?: Editor;
		onPrint?: () => void;
		onResetLayout?: () => void;
	}

	let { editor, onPrint, onResetLayout }: Props = $props();
	let showInsertMenu = $state(false);
	let showMoreMenu = $state(false);
	let fileInput: HTMLInputElement;

	// Button refs for dropdown positioning
	let insertBtnRef = $state<HTMLButtonElement | null>(null);
	let moreBtnRef = $state<HTMLButtonElement | null>(null);

	// Dropdown position state
	let insertMenuPos = $state({ top: 0, left: 0 });
	let moreMenuPos = $state({ top: 0, left: 0, alignRight: false });

	// Calculate dropdown position from button
	function updateInsertMenuPos() {
		if (insertBtnRef) {
			const rect = insertBtnRef.getBoundingClientRect();
			insertMenuPos = { top: rect.bottom + 4, left: rect.left };
		}
	}

	function updateMoreMenuPos() {
		if (moreBtnRef) {
			const rect = moreBtnRef.getBoundingClientRect();
			const alignRight = rect.right > window.innerWidth - 180;
			moreMenuPos = { 
				top: rect.bottom + 4, 
				left: alignRight ? rect.right : rect.left,
				alignRight 
			};
		}
	}

	function handleBold() {
		editor?.toggleBold();
	}

	function handleItalic() {
		editor?.toggleItalic();
	}

	function handleStrikethrough() {
		editor?.wrapSelection('~~', '~~');
	}

	function handleCode() {
		editor?.toggleCode();
	}

	function handleLink() {
		editor?.insertLink();
	}

	function handleImage() {
		editor?.insertImage();
	}

	function handleCodeBlock() {
		editor?.insertCodeBlock();
	}

	function handleHeading(level: number) {
		editor?.insertHeading(level);
	}

	function handleQuote() {
		editor?.insertText('\n> ');
	}

	function handleBulletList() {
		editor?.insertText('\n- Item 1\n- Item 2\n- Item 3\n');
	}

	function handleNumberedList() {
		editor?.insertText('\n1. Item 1\n2. Item 2\n3. Item 3\n');
	}

	function handleTaskList() {
		editor?.insertText('\n- [ ] Task 1\n- [ ] Task 2\n- [x] Completed task\n');
	}

	function handleTable() {
		editor?.insertText('\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n');
	}

	function handleHorizontalRule() {
		editor?.insertText('\n---\n');
	}

	function handleMermaid() {
		editor?.insertText('\n```mermaid\ngraph TD\n    A[Start] --> B[Process]\n    B --> C[End]\n```\n');
	}

	function handleMermaidSequence() {
		editor?.insertText('\n```mermaid\nsequenceDiagram\n    Alice->>Bob: Hello Bob\n    Bob-->>Alice: Hi Alice\n```\n');
	}

	function handleMermaidFlowchart() {
		editor?.insertText('\n```mermaid\nflowchart LR\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Do something]\n    B -->|No| D[Do something else]\n    C --> E[End]\n    D --> E\n```\n');
	}

	function handleMermaidPie() {
		editor?.insertText('\n```mermaid\npie title Distribution\n    "Category A" : 40\n    "Category B" : 35\n    "Category C" : 25\n```\n');
	}

	function handleMathInline() {
		editor?.wrapSelection('$$', '$$');
	}

	function handleMathBlock() {
		editor?.insertText('\n$$\n\\int_{a}^{b} f(x) \\, dx\n$$\n');
	}

	function toggleViewOnly() {
		appState.toggleViewOnlyMode();
	}

	function toggleAutoHide() {
		appState.toggleAutoHideUI();
		closeMenus();
	}

	function toggleWordWrap() {
		appState.toggleWordWrap();
		closeMenus();
	}

	function toggleSyncScroll() {
		appState.toggleSyncScroll();
		closeMenus();
	}

	async function handleExport() {
		const backup = await appState.exportBackup();
		const blob = new Blob([backup], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `sveltemark-backup-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
		closeMenus();
	}

	function handleImportClick() {
		fileInput?.click();
		closeMenus();
	}

	async function handleImportFile(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async (e) => {
			try {
				const content = e.target?.result as string;
				await appState.importBackup(content);
				alert('Backup imported successfully!');
			} catch (err) {
				alert('Failed to import backup: ' + (err as Error).message);
			}
		};
		reader.readAsText(file);
		target.value = '';
	}

	function handlePrint() {
		onPrint?.();
		closeMenus();
	}

	async function handleHelp() {
		await appState.showHelp();
		closeMenus();
	}

	function closeMenus() {
		showInsertMenu = false;
		showMoreMenu = false;
	}
</script>

<svelte:window onclick={closeMenus} />

<input 
	type="file" 
	accept=".json" 
	bind:this={fileInput} 
	onchange={handleImportFile}
	style="display: none;"
/>

<div data-testid="toolbar" class="toolbar">
	<!-- Text formatting -->
	<div class="toolbar-group">
		<button class="toolbar-btn" data-testid="bold-btn" title="Bold (Ctrl+B)" onclick={handleBold} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
			</svg>
		</button>
		<button class="toolbar-btn" data-testid="italic-btn" title="Italic (Ctrl+I)" onclick={handleItalic} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
			</svg>
		</button>
		<button class="toolbar-btn" data-testid="strike-btn" title="Strikethrough" onclick={handleStrikethrough} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/>
			</svg>
		</button>
		<button class="toolbar-btn" data-testid="inline-code-btn" title="Inline Code" onclick={handleCode} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
			</svg>
		</button>
	</div>

	<div class="toolbar-divider"></div>

	<!-- Headings -->
	<div class="toolbar-group">
		<button class="toolbar-btn" data-testid="h1-btn" title="Heading 1" onclick={() => handleHeading(1)} disabled={appState.viewOnlyMode}>
			<span class="text-btn">H1</span>
		</button>
		<button class="toolbar-btn" data-testid="h2-btn" title="Heading 2" onclick={() => handleHeading(2)} disabled={appState.viewOnlyMode}>
			<span class="text-btn">H2</span>
		</button>
		<button class="toolbar-btn" data-testid="h3-btn" title="Heading 3" onclick={() => handleHeading(3)} disabled={appState.viewOnlyMode}>
			<span class="text-btn">H3</span>
		</button>
	</div>

	<div class="toolbar-divider"></div>

	<!-- Lists -->
	<div class="toolbar-group">
		<button class="toolbar-btn" data-testid="bullet-btn" title="Bullet List" onclick={handleBulletList} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
			</svg>
		</button>
		<button class="toolbar-btn" data-testid="numbered-btn" title="Numbered List" onclick={handleNumberedList} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
			</svg>
		</button>
		<button class="toolbar-btn" data-testid="task-btn" title="Task List" onclick={handleTaskList} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M22 5.18L10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10L22 5.18zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8c1.57 0 3.04.46 4.28 1.25l1.45-1.45C16.1 2.67 14.13 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10c1.73 0 3.36-.44 4.78-1.22l-1.5-1.5c-1 .46-2.11.72-3.28.72zm7-5h-3v2h3v3h2v-3h3v-2h-3v-3h-2v3z"/>
			</svg>
		</button>
	</div>

	<div class="toolbar-divider"></div>

	<!-- Links & Media -->
	<div class="toolbar-group">
		<button class="toolbar-btn" data-testid="link-btn" title="Insert Link" onclick={handleLink} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
			</svg>
		</button>
		<button class="toolbar-btn" data-testid="image-btn" title="Insert Image" onclick={handleImage} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
			</svg>
		</button>
		<button class="toolbar-btn" data-testid="codeblock-btn" title="Code Block" onclick={handleCodeBlock} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
			</svg>
		</button>
		<button class="toolbar-btn" data-testid="table-btn" title="Insert Table" onclick={handleTable} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M10 10.02h5V21h-5zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H5c-1.1 0-2 .9-2 2v3h19V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h3V10.02H3V19z"/>
			</svg>
		</button>
		<button class="toolbar-btn" data-testid="quote-btn" title="Blockquote" onclick={handleQuote} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
			</svg>
		</button>
		<button class="toolbar-btn" data-testid="hr-btn" title="Horizontal Rule" onclick={handleHorizontalRule} disabled={appState.viewOnlyMode}>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M19 13H5v-2h14v2z"/>
			</svg>
		</button>
	</div>

	<div class="toolbar-divider"></div>

	<!-- Diagrams (Mermaid) -->
	<div class="toolbar-group dropdown-wrapper">
		<button 
			bind:this={insertBtnRef}
			class="toolbar-btn dropdown-btn" 
			data-testid="insert-menu-btn" title="Insert Diagram" 
			onclick={(e) => { e.stopPropagation(); showInsertMenu = !showInsertMenu; updateInsertMenuPos(); }}
			disabled={appState.viewOnlyMode}
		>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
			</svg>
			<svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" class="dropdown-arrow">
				<path d="M7 10l5 5 5-5z"/>
			</svg>
		</button>
		{#if showInsertMenu}
			<div class="dropdown-menu dropdown-menu-fixed" data-testid="insert-menu" style="top: {insertMenuPos.top}px; left: {insertMenuPos.left}px;">
				<button data-testid="insert-opt-basic" class="dropdown-item" onclick={handleMermaid}>
					<span class="dropdown-icon">📊</span>
					Basic Diagram
				</button>
				<button data-testid="insert-opt-flowchart" class="dropdown-item" onclick={handleMermaidFlowchart}>
					<span class="dropdown-icon">🔀</span>
					Flowchart
				</button>
				<button data-testid="insert-opt-sequence" class="dropdown-item" onclick={handleMermaidSequence}>
					<span class="dropdown-icon">🔄</span>
					Sequence Diagram
				</button>
				<button data-testid="insert-opt-pie" class="dropdown-item" onclick={handleMermaidPie}>
					<span class="dropdown-icon">🥧</span>
					Pie Chart
				</button>
			</div>
		{/if}
	</div>

	<!-- Math -->
	<div class="toolbar-group">
		<button class="toolbar-btn" data-testid="math-inline-btn" title="Inline Math" onclick={handleMathInline} disabled={appState.viewOnlyMode}>
			<span class="text-btn">∑</span>
		</button>
		<button class="toolbar-btn" data-testid="math-block-btn" title="Math Block" onclick={handleMathBlock} disabled={appState.viewOnlyMode}>
			<span class="text-btn">∫</span>
		</button>
	</div>

	<div class="toolbar-divider"></div>

	<!-- More menu (Export, Import, Print, Auto-hide, Reset Layout) -->
	<div class="toolbar-group dropdown-wrapper">
		<button 
			bind:this={moreBtnRef}
			class="toolbar-btn dropdown-btn" 
			data-testid="more-btn" title="More options" 
			onclick={(e) => { e.stopPropagation(); showMoreMenu = !showMoreMenu; updateMoreMenuPos(); }}
		>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
			</svg>
		</button>
		{#if showMoreMenu}
			<div 
				class="dropdown-menu dropdown-menu-fixed" 
				data-testid="more-menu" style="top: {moreMenuPos.top}px; {moreMenuPos.alignRight ? `right: ${window.innerWidth - moreMenuPos.left}px;` : `left: ${moreMenuPos.left}px;`}"
			>
				<button data-testid="more-opt-print" class="dropdown-item" onclick={handlePrint}>
					<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
						<path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
					</svg>
					Print
				</button>
				<div class="dropdown-divider"></div>
				<button data-testid="more-opt-export" class="dropdown-item" onclick={handleExport}>
					<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
						<path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
					</svg>
					Export Backup
				</button>
				<button data-testid="more-opt-import" class="dropdown-item" onclick={handleImportClick}>
					<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
						<path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6-.33l-2.59 2.59L9 13l5-5 5 5-1.41 1.41L13 11.67V21h-2z"/>
					</svg>
					Import Backup
				</button>
				<div class="dropdown-divider"></div>
				<button data-testid="more-opt-autohide" class="dropdown-item" onclick={toggleAutoHide}>
					<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
						{#if appState.autoHideUI}
							<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
						{/if}
					</svg>
					Auto-hide UI
					{#if appState.autoHideUI}
						<span class="check-mark">✓</span>
					{/if}
				</button>
				<button data-testid="more-opt-wordwrap" class="dropdown-item" onclick={toggleWordWrap}>
					<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
						{#if appState.wordWrap}
							<path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 01.02-.022z"/>
						{/if}
					</svg>
					Word Wrap
					{#if appState.wordWrap}
						<span class="check-mark">✓</span>
					{/if}
				</button>
				<button data-testid="more-opt-syncscroll" class="dropdown-item" onclick={toggleSyncScroll}>
					<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
						{#if appState.syncScrollEnabled}
							<path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 01.02-.022z"/>
						{/if}
					</svg>
					Sync Scroll
					{#if appState.syncScrollEnabled}
						<span class="check-mark">✓</span>
					{/if}
				</button>
				<button data-testid="more-opt-reset-layout" class="dropdown-item" onclick={() => { onResetLayout?.(); closeMenus(); }}>
					<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
						<path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
					</svg>
					Reset Layout
				</button>
				<div class="dropdown-divider"></div>
				<button data-testid="more-opt-help" class="dropdown-item" onclick={handleHelp}>
					<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
					</svg>
					Help / Reset Welcome
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 8px 12px;
		background: #161b22;
		flex: 1;
		min-width: 0;
		overflow-x: auto;
		overflow-y: visible;
		scrollbar-width: none;
		-ms-overflow-style: none;
		position: relative;
	}

	.toolbar::-webkit-scrollbar {
		display: none;
	}

	.toolbar-group {
		display: flex;
		gap: 2px;
		flex-shrink: 0;
	}

	.toolbar-divider {
		width: 1px;
		height: 20px;
		background: #30363d;
		margin: 0 8px;
		flex-shrink: 0;
	}

	.toolbar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		background: transparent;
		color: #c9d1d9;
		cursor: pointer;
		border-radius: 6px;
		transition: background-color 0.1s;
	}

	.toolbar-btn:hover:not(:disabled) {
		background: #21262d;
	}

	.toolbar-btn:active:not(:disabled) {
		background: #30363d;
	}

	.toolbar-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.text-btn {
		font-size: 11px;
		font-weight: 600;
	}

	/* Dropdown styles */
	.dropdown-wrapper {
		position: relative;
		z-index: 1000;
	}

	.dropdown-btn {
		width: auto;
		padding: 0 6px;
		gap: 2px;
	}

	.dropdown-arrow {
		opacity: 0.7;
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 4px;
		background: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
		padding: 4px 0;
		min-width: 160px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		z-index: 1000;
	}

	.dropdown-menu-fixed {
		position: fixed;
		margin-top: 0;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 12px;
		border: none;
		background: transparent;
		color: #c9d1d9;
		font-size: 13px;
		font-family: inherit;
		text-align: left;
		cursor: pointer;
	}

	.dropdown-item:hover {
		background: #21262d;
	}

	.dropdown-item svg {
		flex-shrink: 0;
		color: #8b949e;
	}

	.dropdown-divider {
		height: 1px;
		background: #30363d;
		margin: 4px 0;
	}

	.check-mark {
		margin-left: auto;
		color: #3fb950;
	}

	.dropdown-icon {
		width: 20px;
		text-align: center;
	}

	/* Responsive toolbar - hide less important items on smaller screens */
	@media (max-width: 900px) {
		/* Hide H3 and some dividers */
		.toolbar-group:nth-child(4) button:nth-child(3) {
			display: none;
		}
	}

	@media (max-width: 768px) {
		.toolbar {
			padding: 4px 0;
			gap: 2px;
		}

		.toolbar-divider {
			margin: 0 2px;
		}

		.toolbar-btn {
			width: 26px;
			height: 26px;
		}
	}

	@media (max-width: 600px) {
		.toolbar {
			padding: 4px 0;
			gap: 1px;
		}

		.toolbar-btn {
			width: 24px;
			height: 24px;
		}

		.toolbar-divider {
			margin: 0 2px;
			height: 16px;
		}

		.text-btn {
			font-size: 10px;
		}
	}

	@media (max-width: 480px) {
		.toolbar {
			padding: 2px 0;
		}

		.toolbar-btn {
			width: 22px;
			height: 22px;
		}

		.dropdown-btn {
			padding: 0 4px;
		}

		.dropdown-arrow {
			width: 8px;
			height: 8px;
		}
	}
</style>
