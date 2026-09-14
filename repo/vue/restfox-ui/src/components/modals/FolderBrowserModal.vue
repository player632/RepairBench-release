<template>
    <modal title="Browse Folders" v-model="showModalComp" width="600px">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem">
            <input type="text" class="full-width-input" v-model="currentPathInput" @keydown.enter="navigateTo(currentPathInput)" spellcheck="false" placeholder="Path">
            <button class="button" type="button" @click="navigateTo(currentPathInput)">Go</button>
        </div>

        <div v-if="loading" style="opacity: 0.7">Loading...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else class="directory-list">
            <div v-if="parentPath" class="directory-item" @click="navigateTo(parentPath)">
                <i class="fa fa-level-up" style="margin-right: 0.5rem; width: 1rem"></i>..
            </div>
            <div v-for="dir in directories" :key="dir.path" class="directory-item" @click="navigateTo(dir.path)">
                <i class="fa fa-folder" style="margin-right: 0.5rem; width: 1rem"></i>{{ dir.name }}
            </div>
            <div v-if="directories.length === 0" style="opacity: 0.7; padding: 0.25rem 0">No subdirectories</div>
        </div>

        <template #footer>
            <button class="button" type="button" @click="selectCurrentFolder">Select This Folder</button>
        </template>
    </modal>
</template>

<script>
import Modal from '@/components/Modal.vue'

export default {
    props: {
        showModal: Boolean,
        initialPath: {
            type: String,
            default: ''
        }
    },
    components: { Modal },
    data() {
        return {
            currentPath: '',
            currentPathInput: '',
            parentPath: null,
            directories: [],
            loading: false,
            error: null,
        }
    },
    computed: {
        showModalComp: {
            get() {
                return this.showModal
            },
            set(value) {
                this.$emit('update:showModal', value)
            }
        }
    },
    mounted() {
        this.navigateTo(this.initialPath || '')
    },
    methods: {
        async navigateTo(dirPath) {
            this.loading = true
            this.error = null
            try {
                const response = await fetch(`/api/browse?path=${encodeURIComponent(dirPath || '')}`)
                const data = await response.json()
                if (data.error) {
                    this.error = data.error
                } else {
                    const result = data.result
                    this.currentPath = result.currentPath
                    this.currentPathInput = result.currentPath
                    this.parentPath = result.parentPath
                    this.directories = result.directories
                }
            } catch (e) {
                this.error = e.message
            } finally {
                this.loading = false
            }
        },
        selectCurrentFolder() {
            this.$emit('folder-selected', this.currentPath)
            this.showModalComp = false
        }
    }
}
</script>

<style scoped>
.directory-list {
    max-height: 300px;
    overflow-y: auto;
}

.directory-item {
    padding: 0.4rem 0.5rem;
    cursor: pointer;
    border-radius: 3px;
    user-select: none;
}

.directory-item:hover {
    background-color: var(--background-color);
}

.error-message {
    color: var(--base-color-error);
}
</style>
