<template>
    <div v-if="$tasksLists.current" class="flex items-center px-4 py-6">
        <Button
            data-testid="rb-sidebar-toggle"
            size="icon"
            variant="ghost"
            class="p-1.5"
            :title="$workspaces.sidebar ? $t('workspaces.hideSidebar') : $t('workspaces.openSidebar')"
            :aria-label="$workspaces.sidebar ? $t('workspaces.hideSidebar') : $t('workspaces.openSidebar')"
            @click="$workspaces.toggleSidebar()"
        >
            <i-tabler-layout-sidebar-filled class="size-6" />
        </Button>
        <h1 data-testid="rb-header-title" class="ml-1 truncate text-xl font-semibold">
            {{ $listName($tasksList) }}
        </h1>
        <div class="grow" />
        <ErrorLogs />
        <Button
            data-testid="rb-search-open"
            size="icon"
            variant="ghost"
            :aria-label="$t('workspace.search')"
            :title="$t('workspace.search')"
            :class="$solid.hasLoggedIn() && 'mr-2'"
            @click="$ui.modal(WorkspaceSearchModal)"
        >
            <i-zondicons-search class="size-5" />
        </Button>
        <Account />
    </div>
</template>

<script setup lang="ts">
import { UI } from '@aerogel/core';

import { watchKeyboardShortcut } from '@/utils/composables';

import WorkspaceSearchModal from './modals/WorkspaceSearchModal.vue';

watchKeyboardShortcut('s', { prevent: true }, () => UI.modal(WorkspaceSearchModal));
</script>
