<script lang="ts">
    import {getSetting} from "$lib/contexts";
    import RepeatableInputModal from "../modals/RepeatableInputModal.svelte";
    import Text from "./Text.svelte";

    type Props = {
        value: string[];
        placeholder?: string;
        canReorder?: boolean;
    };

    let {
        value = $bindable([]),
        placeholder = "Add a value…", // eslint-disable-line prefer-const
        canReorder = true, // eslint-disable-line prefer-const
    }: Props = $props();

    const settingInfo = getSetting();
    let isEditorOpen = $state(false);
    let draftValues = $state<string[]>([]);

    const normalizedValues = $derived(value.map(item => item.trim()).filter(item => item !== ""));
    const hiddenCount = $derived(Math.max(normalizedValues.length - 1, 0));

    function openEditor() {
        draftValues = value;
        isEditorOpen = true;
    }

    function closeEditor() {
        isEditorOpen = false;
        draftValues = [];
    }

    function onEditorSave() {
        const cleaned = draftValues.map(item => item.trim()).filter(item => item !== "");
        value = cleaned;
        closeEditor();
    }

    function handleEditorKeydown(event: KeyboardEvent) {
        if (!isEditorOpen) return;
        if (event.key === "Escape") closeEditor();
    }

    $effect(() => {
        if (draftValues.length !== 0) return;
        draftValues = [""];
    });
</script>

<div class="repeatable-setting">
    {#if hiddenCount > 0}
        <span class="more">+{hiddenCount} more</span>
    {/if}
    <Text bind:value={value[0]} {placeholder} size={15} onfocus={openEditor} />
</div>

<svelte:document onkeydown={handleEditorKeydown} />

{#if isEditorOpen}
    <RepeatableInputModal
        bind:draftValues
        title={settingInfo?.name ?? "Repeatable Value Editor"}
        onsave={onEditorSave}
        {placeholder}
        {canReorder}
        onclose={closeEditor}
    />
{/if}

<style>
.repeatable-setting {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    max-width: 380px;
}

.more {
    color: var(--font-color-muted);
    font-size: 0.9rem;
    white-space: nowrap;
}
</style>