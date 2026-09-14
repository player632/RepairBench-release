# Backup & Import Adapter Analysis

## Current Architecture Overview

Your app uses a **file-based JSON adapter pattern** for backup and import functionality. Here's how it works:

### 1. **Core Functions in `appState.svelte.ts`**

#### Export Backup

```typescript
async function exportBackup(): Promise<string> {
    const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        folders: folders,
        files: files
    };
    return JSON.stringify(backup, null, 2);
}
```

**What it does:**

- Collects all folders and files from local state
- Wraps them with metadata (version, export timestamp)
- Returns JSON string

#### Import Backup

```typescript
async function importBackup(jsonString: string): Promise<void> {
    const backup = JSON.parse(jsonString);

    if (!backup.folders || !backup.files) {
        throw new Error('Invalid backup format');
    }

    // 1. Clear existing data
    for (const file of files) {
        if (file.id) await deleteFile(file.id);
    }
    for (const folder of folders) {
        if (folder.id) await deleteFolder(folder.id);
    }

    // 2. Import folders maintaining hierarchy
    // Map old IDs to new IDs (important for references)
    const folderIdMap: Record<number, number> = {};
    for (const folder of sortedFolders) {
        const oldId = folder.id;
        const newParentId = folder.parentId !== null ? folderIdMap[folder.parentId] ?? null : null;
        const newId = await createFolder(folder.name, newParentId);
        folderIdMap[oldId] = newId;

        if (folder.isOpen === false) {
            await toggleFolderOpen(newId);
        }
    }

    // 3. Import files with remapped folder references
    for (const file of backup.files) {
        const newFolderId = file.folderId !== null ? folderIdMap[file.folderId] ?? null : null;
        await createFile(newFolderId, file.title, file.content);
    }

    // 4. Refresh UI and select first file
    await refreshData();
    activeFileId = null;
    buffer = '';
    dirty = false;

    if (files.length > 0) {
        await selectFile(files[0].id!);
    }
}
```

**What it does:**

- Validates backup JSON structure
- **Clears all existing data** (destructive operation)
- Imports folders while preserving hierarchy
- Imports files with correct folder references (using ID mapping)
- Refreshes UI state

### 2. **UI Integration in `Toolbar.svelte`**

```svelte
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
```

### 3. **Backup Data Format**

```json
{
	"version": 1,
	"exportedAt": "2025-12-07T10:30:00.000Z",
	"folders": [
		{
			"id": 1,
			"name": "My Folder",
			"parentId": null,
			"isOpen": true
		}
	],
	"files": [
		{
			"id": 1,
			"folderId": 1,
			"title": "My Document",
			"content": "# Markdown content here",
			"createdAt": "2025-12-07T10:00:00.000Z",
			"updatedAt": "2025-12-07T10:30:00.000Z"
		}
	]
}
```

---

## How to Add New Methods (Google Drive, GitHub, etc.)

### Pattern: Create an Adapter Interface

```typescript
// src/lib/adapters/types.ts
export interface StorageAdapter {
    name: string;
    id: string;

    // Export data (serialize backup)
    exportData(): Promise<string>;

    // Import data (deserialize backup)
    importData(data: string): Promise<void>;

    // Optional: Cloud operations
    uploadToCloud?(): Promise<string>; // Returns URL or ID
    downloadFromCloud?(id: string): Promise<string>;

    // Optional: Authentication
    authenticate?(): Promise<void>;
    isAuthenticated?(): boolean;
}
```

### Step 1: Create Adapter Base (Abstract/Interface)

**File: `src/lib/adapters/base.ts`**

```typescript
export interface BackupData {
    version: number;
    exportedAt: string;
    folders: any[];
    files: any[];
}

export abstract class StorageAdapter {
    abstract name: string;
    abstract id: string;

    /**
     * Serialize app data into transportable format
     */
    abstract serialize(folders: any[], files: any[]): Promise<string>;

    /**
     * Deserialize and import data
     */
    abstract deserialize(data: string): Promise<BackupData>;

    /**
     * Upload to remote storage (optional)
     */
    uploadToRemote?(data: string): Promise<{ id: string; url?: string }>;

    /**
     * Download from remote storage (optional)
     */
    downloadFromRemote?(id: string): Promise<string>;
}
```

### Step 2: Implement Adapters

**File: `src/lib/adapters/json-adapter.ts`**

```typescript
import { StorageAdapter, type BackupData } from './base';

export class JSONAdapter extends StorageAdapter {
    name = 'JSON File';
    id = 'json-file';

    async serialize(folders: any[], files: any[]): Promise<string> {
        const backup: BackupData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            folders: folders,
            files: files
        };
        return JSON.stringify(backup, null, 2);
    }

    async deserialize(data: string): Promise<BackupData> {
        const backup = JSON.parse(data);
        if (!backup.folders || !backup.files) {
            throw new Error('Invalid backup format');
        }
        return backup;
    }
}
```

**File: `src/lib/adapters/google-drive-adapter.ts`**

```typescript
import { StorageAdapter, type BackupData } from './base';

export class GoogleDriveAdapter extends StorageAdapter {
    name = 'Google Drive';
    id = 'google-drive';

    private accessToken: string | null = null;
    private fileId: string | null = null;

    async authenticate(): Promise<void> {
        // Implement Google OAuth 2.0 flow
        // Use google-auth-library or similar
        const token = await this.requestGoogleAuth();
        this.accessToken = token;
    }

    async serialize(folders: any[], files: any[]): Promise<string> {
        const backup: BackupData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            folders,
            files
        };
        return JSON.stringify(backup, null, 2);
    }

    async deserialize(data: string): Promise<BackupData> {
        const backup = JSON.parse(data);
        if (!backup.folders || !backup.files) {
            throw new Error('Invalid Google Drive backup format');
        }
        return backup;
    }

    async uploadToRemote(data: string): Promise<{ id: string; url?: string }> {
        if (!this.accessToken) {
            await this.authenticate();
        }

        // Upload to Google Drive
        const fileData = new Blob([data], { type: 'application/json' });
        const metadata = {
            name: `sveltemark-backup-${new Date().toISOString().split('T')[0]}.json`,
            mimeType: 'application/json'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', fileData);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: form
        });

        const result = await response.json();
        this.fileId = result.id;

        return {
            id: result.id,
            url: `https://drive.google.com/file/d/${result.id}`
        };
    }

    async downloadFromRemote(id: string): Promise<string> {
        if (!this.accessToken) {
            await this.authenticate();
        }

        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );

        return await response.text();
    }

    private async requestGoogleAuth(): Promise<string> {
        // Implement OAuth flow - placeholder
        // Would use google-auth-library or similar
        throw new Error('Implement Google OAuth flow');
    }
}
```

**File: `src/lib/adapters/github-adapter.ts`**

```typescript
import { StorageAdapter, type BackupData } from './base';

export class GitHubAdapter extends StorageAdapter {
    name = 'GitHub';
    id = 'github';

    private token: string | null = null;
    private owner: string = '';
    private repo: string = '';

    constructor(owner?: string, repo?: string) {
        super();
        this.owner = owner || '';
        this.repo = repo || '';
    }

    async authenticate(token: string): Promise<void> {
        this.token = token;
        // Verify token by making a test request
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error('Invalid GitHub token');
        }
    }

    async serialize(folders: any[], files: any[]): Promise<string> {
        const backup: BackupData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            folders,
            files
        };
        return JSON.stringify(backup, null, 2);
    }

    async deserialize(data: string): Promise<BackupData> {
        const backup = JSON.parse(data);
        if (!backup.folders || !backup.files) {
            throw new Error('Invalid GitHub backup format');
        }
        return backup;
    }

    async uploadToRemote(data: string): Promise<{ id: string; url?: string }> {
        if (!this.token || !this.owner || !this.repo) {
            throw new Error('GitHub credentials not configured');
        }

        const fileName = `backup-${new Date().toISOString().split('T')[0]}.json`;
        const filePath = `backups/${fileName}`;

        // Check if file exists
        const existingFile = await fetch(
            `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${filePath}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        let sha: string | undefined;
        if (existingFile.ok) {
            const fileData = await existingFile.json();
            sha = fileData.sha;
        }

        // Create or update file
        const response = await fetch(
            `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${filePath}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Backup from SvelteMark: ${new Date().toISOString()}`,
                    content: btoa(data), // Base64 encode
                    sha: sha
                })
            }
        );

        const result = await response.json();

        return {
            id: filePath,
            url: `https://github.com/${this.owner}/${this.repo}/blob/main/${filePath}`
        };
    }

    async downloadFromRemote(filePath: string): Promise<string> {
        if (!this.token || !this.owner || !this.repo) {
            throw new Error('GitHub credentials not configured');
        }

        const response = await fetch(
            `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${filePath}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3.raw'
                }
            }
        );

        return await response.text();
    }
}
```

### Step 3: Update `appState.svelte.ts` to Use Adapters

```typescript
import { JSONAdapter } from './adapters/json-adapter';
import type { StorageAdapter, BackupData } from './adapters/base';

// Store current adapter
let currentAdapter: StorageAdapter = new JSONAdapter();

// Export with current adapter
async function exportBackupWithAdapter(adapter?: StorageAdapter): Promise<string> {
    const adapterToUse = adapter || currentAdapter;
    const serialized = await adapterToUse.serialize(folders, files);
    return serialized;
}

// Import with current adapter
async function importBackupWithAdapter(
    jsonString: string,
    adapter?: StorageAdapter
): Promise<void> {
    const adapterToUse = adapter || currentAdapter;
    const backup = await adapterToUse.deserialize(jsonString);

    // ... rest of import logic remains the same ...
}

// Switch adapter
function setStorageAdapter(adapter: StorageAdapter): void {
    currentAdapter = adapter;
}

// Upload to cloud
async function uploadToCloud(adapter: StorageAdapter): Promise<{ id: string; url?: string }> {
    if (!adapter.uploadToRemote) {
        throw new Error(`${adapter.name} does not support cloud uploads`);
    }

    const data = await exportBackupWithAdapter(adapter);
    return adapter.uploadToRemote(data);
}

// Download from cloud
async function downloadFromCloud(
    adapter: StorageAdapter,
    id: string
): Promise<void> {
    if (!adapter.downloadFromRemote) {
        throw new Error(`${adapter.name} does not support cloud downloads`);
    }

    const data = await adapter.downloadFromRemote(id);
    await importBackupWithAdapter(data, adapter);
}

export const appState = {
    // ... existing exports ...
    exportBackupWithAdapter,
    importBackupWithAdapter,
    setStorageAdapter,
    uploadToCloud,
    downloadFromCloud
};
```

### Step 4: Update UI in `Toolbar.svelte`

```svelte
<script lang="ts">
    import { JSONAdapter } from '$lib/adapters/json-adapter';
    import { GoogleDriveAdapter } from '$lib/adapters/google-drive-adapter';
    import { GitHubAdapter } from '$lib/adapters/github-adapter';

    let selectedAdapter = $state<string>('json-file');
    let adapters = $state([
        new JSONAdapter(),
        new GoogleDriveAdapter(),
        new GitHubAdapter()
    ]);

    async function handleExportWithAdapter() {
        const adapter = adapters.find(a => a.id === selectedAdapter);
        if (!adapter) return;

        // For JSON, download as file
        if (adapter.id === 'json-file') {
            const backup = await appState.exportBackupWithAdapter(adapter);
            const blob = new Blob([backup], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sveltemark-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (adapter.uploadToRemote) {
            // For cloud adapters, upload directly
            const result = await appState.uploadToCloud(adapter);
            alert(`Backup saved to ${adapter.name}!\nID: ${result.id}\nURL: ${result.url || 'N/A'}`);
        }
    }
</script>

<!-- Dropdown to select adapter -->
<select bind:value={selectedAdapter} class="adapter-select">
    {#each adapters as adapter}
        <option value={adapter.id}>{adapter.name}</option>
    {/each}
</select>

<button onclick={handleExportWithAdapter}>
    Export via {adapters.find(a => a.id === selectedAdapter)?.name}
</button>
```

---

## Summary: Key Concepts

### 1. **Adapter Pattern**

- Define interface (`StorageAdapter`)
- Implement for each backend (JSON, Google Drive, GitHub)
- Swap adapters without changing core logic

### 2. **Current Data Format**

```json
{
	"version": 1,
	"exportedAt": "ISO string",
	"folders": [],
	"files": []
}
```

### 3. **Critical Operations**

- **Serialize**: App data → JSON string
- **Deserialize**: JSON string → validated BackupData
- **Import logic**: Clear old → Import folders → Import files → Refresh UI
- **ID Mapping**: Important when importing to maintain folder hierarchy

### 4. **Add-on Features**

- Cloud upload/download
- Authentication (OAuth for Google, tokens for GitHub)
- File versioning
- Compression (gzip)
- Encryption

---

## Next Steps

1. **Create adapter interface** (`src/lib/adapters/base.ts`)
2. **Implement JSON adapter** (refactor existing code)
3. **Implement Google Drive adapter** (requires OAuth setup)
4. **Implement GitHub adapter** (requires personal access token)
5. **Update UI** to select adapters
6. **Add authentication flows** for cloud services
7. **Test import/export** with each adapter

Would you like me to implement any of these adapters?
