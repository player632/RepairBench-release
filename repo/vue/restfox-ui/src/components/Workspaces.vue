<template>
    <div class="workspace-container">
        <div class="workspace" v-for="workspace in workspaces" @click="setActiveWorkspace(workspace)" data-testid="rfx-workspace-card">
            <div class="workspace-settings-button-container">
                <div class="workspace-settings-button" @click.stop="handleContextMenu($event, workspace)">
                    <svg width="1em" height="1em" viewBox="0 0 14 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM7 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12.5 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill=""></path>
                    </svg>
                </div>
            </div>
            <div class="workspace-name">{{ workspace.name }}</div>
            <div class="workspace-timestamp">{{ dateFormat(workspace.createdAt) }}</div>
        </div>
        <ContextMenu v-if="!isMobile" :options="options" v-model:show="showContextMenu" @click="handleContextMenuClick" :element="contextMenuElement" />
        <MobileBottomSheet
            v-else
            :show="showWorkspaceMobileSheet"
            :items="mobileWorkspaceOptions"
            @select="handleContextMenuClick"
            @update:show="showWorkspaceMobileSheet = $event"
        />
        <AddWorkspaceModal v-model:showModal="showAddWorkspaceModal" :workspace="contextMenuWorkspace" :is-electron="flags.isElectron" :is-file-workspace-supported="flags.isElectron || flags.isWebStandalone" />
        <DuplicateWorkspaceModal v-model:showModal="showDuplicateWorkspaceModal" :workspace-to-duplicate="workspaceToDuplicate" :is-electron="flags.isElectron" :is-file-workspace-supported="flags.isElectron || flags.isWebStandalone" />
    </div>
</template>

<script>
import ContextMenu from './ContextMenu.vue'
import AddWorkspaceModal from './modals/AddWorkspaceModal.vue'
import DuplicateWorkspaceModal from './modals/DuplicateWorkspaceModal.vue'
import MobileBottomSheet from './MobileBottomSheet.vue'
import { useMobile } from '@/composables/useMobile'
import dayjs from 'dayjs'

export default {
    components: {
        ContextMenu,
        AddWorkspaceModal,
        DuplicateWorkspaceModal,
        MobileBottomSheet
    },
    setup() {
        const { isMobile } = useMobile()
        return { isMobile }
    },
    data() {
        return {
            showContextMenu: false,
            contextMenuElement: null,
            contextMenuWorkspace: null,
            showAddWorkspaceModal: false,
            showDuplicateWorkspaceModal: false,
            workspaceToDuplicate: null,
            showWorkspaceMobileSheet: false
        }
    },
    computed: {
        workspaces() {
            return this.$store.state.workspaces
        },
        flags() {
            return this.$store.state.flags
        },
        mobileWorkspaceOptions() {
            return this.options.map(item => {
                if(item.value === 'Delete') {
                    return { ...item, type: 'danger' }
                }
                return item
            })
        },
        options() {
            const options = [
                {
                    'type': 'option',
                    'label': 'Duplicate',
                    'value': 'Duplicate'
                },
                {
                    'type': 'option',
                    'label': 'Delete',
                    'value': 'Delete'
                }
            ]

            if(this.contextMenuWorkspace && this.contextMenuWorkspace._type === 'file') {
                options.splice(
                    4,
                    0,
                    {
                        'type': 'option',
                        'label': 'Close',
                        'value': 'Close'
                    }
                )
            }

            options.push(
                {
                    'type': 'separator'
                },
                {
                    'type': 'option',
                    'label': 'Properties',
                    'value': 'Properties'
                }
            )

            return options
        }
    },
    methods: {
        setActiveWorkspace(workspace) {
            this.$store.commit('setActiveWorkspace', workspace)
        },
        handleContextMenu(event, workspace) {
            this.contextMenuWorkspace = workspace
            if(this.isMobile) {
                this.showWorkspaceMobileSheet = true
                return
            }
            this.contextMenuElement = event.target.closest('.workspace-settings-button')
            this.showContextMenu = true
        },
        async handleContextMenuClick(clickedContextMenuItem) {
            if(clickedContextMenuItem === 'Duplicate') {
                this.workspaceToDuplicate = JSON.parse(JSON.stringify(this.contextMenuWorkspace))
                this.showDuplicateWorkspaceModal = true
            }

            if(clickedContextMenuItem === 'Delete') {
                if(await window.createConfirm('Are you sure?')) {
                    this.$store.dispatch('deleteWorkspace', this.contextMenuWorkspace._id)
                }
            }

            if(clickedContextMenuItem === 'Properties') {
                this.showAddWorkspaceModal = true
            }

            if(clickedContextMenuItem === 'Close') {
                if(await window.createConfirm('Are you sure?')) {
                    this.$store.dispatch('closeWorkspace', this.contextMenuWorkspace._id)
                }
            }
        },
        dateFormat(date) {
            return dayjs(date).format('DD-MMM-YY hh:mm A')
        }
    }
}
</script>

<style scoped>
.workspace-container {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 1rem;
    margin: 1rem;
}

.workspace {
    border: 1px solid var(--default-border-color);
    cursor: pointer;
    height: 196px;
    width: 204px;
    border-radius: 4px;
    user-select: none;
    word-break: break-all;
    display: grid;
    grid-template-rows: auto auto 1fr;
}

.workspace:hover {
    border: 1px solid var(--base-color-info);
}

.workspace svg {
    fill: var(--text-color);
    color: var(--text-color);
}

.workspace-settings-button-container {
    text-align: right;
}

.workspace-settings-button {
    display: inline-block;
    padding: 1rem;
}

.workspace-name, .workspace-timestamp {
    padding-left: 1rem;
    padding-right: 1rem;
}

.workspace-timestamp {
    margin-bottom: 1rem;
    display: grid;
    place-items: self-end;
}

.workspace-settings-button:hover {
    background-color: var(--workspace-menu-hover-background-color);
}

@media (max-width: 768px) {
    .workspace-container {
        gap: 0.6rem;
        margin: 0.6rem;
    }

    .workspace {
        width: calc(50% - 0.3rem);
        height: 130px;
    }
}
</style>
