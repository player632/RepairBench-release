<script lang="ts">
	import { appState } from '$lib/appState.svelte';
	import FileTree from './FileTree.svelte';

	let isDragOverRoot = $state(false);
	let fileTreeRef = $state<any>(null);

	// Trigger new file/folder creation in the FileTree component
	function handleNewFile() {
		if (fileTreeRef?.startCreatingFromExternal) {
			fileTreeRef.startCreatingFromExternal('file', null);
		}
	}

	function handleNewFolder() {
		if (fileTreeRef?.startCreatingFromExternal) {
			fileTreeRef.startCreatingFromExternal('file', null);
		}
	}

	// Handle dropping items to root level
	function handleRootDragOver(event: DragEvent) {
		const target = event.target as HTMLElement;
		const treeButton = target.closest('.tree-button');
		
		if (!treeButton) {
			// Not over a tree item - show root highlight
			event.preventDefault();
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = 'move';
			}
			isDragOverRoot = true;
		} else {
			// Check if over a file that's at root level (no parent folder class)
			// Files at root should trigger root highlight
			const isFile = treeButton.classList.contains('file');
			const isInNestedFolder = treeButton.closest('.file-tree .file-tree'); // nested file-tree means inside a folder
			
			if (isFile && !isInNestedFolder) {
				// File is at root level - show root highlight
				event.preventDefault();
				if (event.dataTransfer) {
					event.dataTransfer.dropEffect = 'move';
				}
				isDragOverRoot = true;
			} else {
				isDragOverRoot = false;
			}
		}
	}

	function handleRootDragLeave(event: DragEvent) {
		// Check if we're leaving the container entirely
		const relatedTarget = event.relatedTarget as HTMLElement;
		const container = event.currentTarget as HTMLElement;
		
		if (!relatedTarget || !container.contains(relatedTarget)) {
			isDragOverRoot = false;
		}
	}
	
	function handleDragEnd() {
		// Always clear the root highlight when drag ends
		isDragOverRoot = false;
	}

	async function handleRootDrop(event: DragEvent) {
		// Always clear the highlight first
		isDragOverRoot = false;
		
		// Check if we're NOT over a tree-button (file/folder item)
		const target = event.target as HTMLElement;
		const isOverTreeItem = target.closest('.tree-button');
		
		if (isOverTreeItem) {
			// Let the tree item handle it
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		const data = event.dataTransfer?.getData('text/plain');
		if (!data) return;

		try {
			const draggedData = JSON.parse(data);
			const draggedType = draggedData.type as 'file' | 'folder';
			const draggedId = draggedData.id as number;

			// Don't move if already at root
			if (draggedData.parentId === null) return;

			if (draggedType === 'file') {
				await appState.moveFileToFolder(draggedId, null);
			} else {
				await appState.moveFolderToParent(draggedId, null);
			}
		} catch (error) {
			console.error('Failed to handle root drop:', error);
		}
	}
</script>

<aside data-testid="sidebar" class="sidebar">
	<div class="sidebar-header">
		<span class="title">EXPLORER</span>
		<div class="actions">
			<button
				class="action-btn"
				data-testid="new-file-btn" title="New File..."
				onclick={handleNewFile}
			>
				<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
					<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
				</svg>
			</button>
			<button
				class="action-btn"
				data-testid="new-folder-btn" title="New Folder..."
				onclick={handleNewFolder}
			>
				<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
					<path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
				</svg>
			</button>
		</div>
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		data-testid="file-tree-container" class="file-tree-container"
		class:drag-over-root={isDragOverRoot}
		ondragover={handleRootDragOver}
		ondragleave={handleRootDragLeave}
		ondragend={handleDragEnd}
		ondrop={handleRootDrop}
	>
		<div class="scrollable-content">
			<FileTree bind:this={fileTreeRef} items={appState.fileTree} />
			{#if appState.fileTree.length === 0}
				<div class="empty-state">
					<p>No files yet</p>
					<p class="hint">Create a file or folder to get started</p>
				</div>
			{/if}
			<div 
				class="root-drop-zone"
				class:visible={isDragOverRoot}
			>
				Drop here to move to root
			</div>
		</div>
	</div>

	<div class="sidebar-footer">
		<a 
			href="https://github.com/MasFana/sveltemark" 
			target="_blank" 
			rel="noopener noreferrer"
			data-testid="github-link" class="github-link"
			title="Star on GitHub"
		>
			<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
				<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
			</svg>
			<span>Star on GitHub</span>
		</a>
	</div>
</aside>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		background: #161b22;
		border-right: 1px solid #30363d;
		overflow: hidden;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 12px;
		height: 41px;
		min-height: 41px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #8b949e;
		border-bottom: 1px solid #30363d;
		box-sizing: border-box;
	}

	.actions {
		display: flex;
		gap: 4px;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border: none;
		background: transparent;
		color: #c9d1d9;
		cursor: pointer;
		border-radius: 4px;
		transition: background-color 0.15s;
		padding: 0;
	}

	.action-btn:hover {
		background: #21262d;
	}

	.action-btn svg {
		width: 16px;
		height: 16px;
	}

	.file-tree-container {
		flex: 1;
		overflow: hidden;
		background: #161b22;
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.scrollable-content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 4px 0;
		transition: all 0.15s;
	}

	.file-tree-container.drag-over-root .scrollable-content {
		background: #21262d;
		outline: 1px solid #58a6ff;
		outline-offset: -1px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 24px;
		color: #8b949e;
		text-align: center;
	}

	.empty-state p {
		margin: 0;
	}

	.empty-state .hint {
		font-size: 12px;
		margin-top: 4px;
		opacity: 0.7;
	}

	.root-drop-zone {
		position: absolute;
		bottom: 8px;
		left: 8px;
		right: 8px;
		padding: 12px;
		background: #30363d;
		border: 1px solid #58a6ff;
		border-radius: 6px;
		color: #58a6ff;
		font-size: 12px;
		text-align: center;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.15s;
	}

	.root-drop-zone.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.sidebar-footer {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px 12px;
		height: 41px;
		min-height: 41px;
		border-top: 1px solid #30363d;
		background: #161b22;
		box-sizing: border-box;
	}

	.github-link {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: #21262d;
		color: #c9d1d9;
		border: 1px solid #30363d;
		border-radius: 6px;
		text-decoration: none;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
	}

	.github-link:hover {
		background: #30363d;
		border-color: #58a6ff;
		color: #58a6ff;
	}

	.github-link svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}
</style>
