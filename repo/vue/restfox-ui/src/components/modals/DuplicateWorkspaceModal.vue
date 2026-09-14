<template>
    <form @submit.prevent="duplicateWorkspace" v-if="showModalComp">
        <modal title="Duplicate Workspace" v-model="showModalComp">
            <label>
                <div style="font-weight: 500; margin-bottom: var(--label-margin-bottom)">Name</div>
                <input type="text" class="full-width-input" v-model="newName" placeholder="Workspace Name" required spellcheck="false" v-focus :disabled="duplicating">
            </label>

            <template v-if="isFileWorkspaceSupported">
                <div style="margin-top: 1rem">
                    <label>
                        <div style="font-weight: 500; margin-bottom: var(--label-margin-bottom)">Type</div>
                        <select class="full-width-input" v-model="workspaceType" required :disabled="duplicating">
                            <option v-for="workspaceTypeItem in workspaceTypes" :value="workspaceTypeItem.value">{{ workspaceTypeItem.label }}</option>
                        </select>
                    </label>
                </div>

                <div style="margin-top: 1rem" v-if="workspaceType === 'file'">
                    <label>
                        <div style="font-weight: 500; margin-bottom: var(--label-margin-bottom)">Choose a folder</div>
                        <div style="display: flex;">
                            <input type="text" class="full-width-input" v-model="workspaceLocation" placeholder="Folder Path" required spellcheck="false" :disabled="duplicating">
                            <button class="button" type="button" @click="openFolderDialog" :disabled="duplicating" v-if="isElectron">Choose</button>
                            <button class="button" type="button" @click="showFolderBrowser = true" :disabled="duplicating" v-if="!isElectron">Browse</button>
                        </div>
                    </label>
                    <div style="margin-top: 0.5rem">Provide an empty folder</div>
                </div>
            </template>

            <div style="margin-top: 1.5rem">
                <label style="display: flex">
                    <input type="checkbox" v-model="includeResponseHistory" :disabled="duplicating"> <div style="margin-left: 0.5rem">Include Response History</div>
                </label>
            </div>

            <template #footer>
                <button class="button" v-if="!duplicating">Duplicate</button>
                <button class="button" disabled v-else>Duplicating...</button>
            </template>
        </modal>
    </form>

    <folder-browser-modal v-if="showFolderBrowser" v-model:showModal="showFolderBrowser" :initial-path="workspaceLocation" @folder-selected="workspaceLocation = $event" />
</template>

<script>
import Modal from '@/components/Modal.vue'
import FolderBrowserModal from '@/components/modals/FolderBrowserModal.vue'
import { fileIPC } from '@/db'

export default {
    directives: {
        focus: {
            mounted(element) {
                element.focus()
                element.select()
            }
        }
    },
    props: {
        showModal: Boolean,
        workspaceToDuplicate: Object,
        isElectron: {
            type: Boolean,
            default: false
        },
        isFileWorkspaceSupported: {
            type: Boolean,
            default: false
        },
    },
    components: {
        Modal,
        FolderBrowserModal,
    },
    data() {
        return {
            newName: '',
            workspaceType: 'local',
            workspaceLocation: '',
            showFolderBrowser: false,
            workspaceTypes: [
                { label: 'In Filesystem (Git Friendly)', value: 'file' },
                { label: 'In Application', value: 'local' }
            ],
            duplicating: false,
            includeResponseHistory: true,
        }
    },
    computed: {
        showModalComp: {
            get() {
                return this.showModal
            },
            set(value) {
                if(this.duplicating) {
                    return
                }
                this.$emit('update:showModal', value)
            }
        }
    },
    watch: {
        workspaceToDuplicate() {
            if(this.workspaceToDuplicate) {
                this.newName = this.workspaceToDuplicate.name + ' (copy)'

                if(this.isFileWorkspaceSupported) {
                    this.workspaceType = 'file'
                    this.workspaceLocation = ''
                }
            }
        }
    },
    methods: {
        async duplicateWorkspace() {
            if(this.isFileWorkspaceSupported && this.workspaceType === 'file') {
                const result = await fileIPC.ensureEmptyFolderOrEmptyWorkspace(this.workspaceLocation)

                if(result.error) {
                    this.$toast.error(result.error)
                    return
                }
            }

            this.duplicating = true

            try {
                await this.$store.dispatch('duplicateWorkspace', {
                    sourceWorkspace: JSON.parse(JSON.stringify(this.workspaceToDuplicate)),
                    name: this.newName,
                    type: this.workspaceType,
                    location: this.workspaceLocation,
                    includeResponseHistory: this.includeResponseHistory,
                })
            } catch (error) {
                console.error(error)
                this.duplicating = false
                this.showModalComp = false
                this.$toast.error('Failed to duplicate workspace: ' + error.message)
                return
            }

            this.duplicating = false
            this.showModalComp = false

            this.$toast.success('Workspace duplicated successfully')
        },
        async openFolderDialog() {
            this.workspaceLocation = await window.electronIPC.openFolderSelectionDialog()
        },
    }
}
</script>
