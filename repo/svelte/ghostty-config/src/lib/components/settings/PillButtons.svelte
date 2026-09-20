<script lang="ts" module>
    export type PillVariant = "neutral" | "accent" | "danger";
    export type PillSize = "default" | "compact";

    export interface PillOption {
        label: string;
        value: string;
        variant?: PillVariant;
        size?: PillSize;
    }
</script>


<script lang="ts">
    interface Props {
        value: string;
        options: PillOption[];
        onchange?: (v: string) => void;
        size?: PillSize;
    }

    // eslint-disable-next-line prefer-const
    let {value = $bindable(), options, onchange, size = "default"}: Props = $props();

    function click(optionValue: string) {
        value = optionValue;
        onchange?.(value);
    }
</script>


<div class="pill-group" role="group" class:compact={size === "compact"}>
    {#each options as option (option.value)}
        <button
            type="button"
            class="pill"
            class:active={value === option.value}
            class:danger={option.variant === "danger"}
            class:accent={option.variant === "accent"}
            onclick={() => click(option.value)}
            aria-pressed={value === option.value}
        >
            {option.label}
        </button>
    {/each}
</div>


<style>
.pill-group {
    display: inline-flex;
    border-radius: var(--radius-level-4);
    border: 1px solid rgba(255,255,255,0.13);
    background: rgba(255,255,255,0.06);
    padding: 2px;
    gap: 2px;
}

.pill {
    border: none;
    border-radius: calc(var(--radius-level-4) - 2px);
    padding: 2px 10px;
    font-size: 0.85em;
    font-family: inherit;
    color: var(--font-color-muted);
    background: transparent;
    cursor: pointer;
    transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
    white-space: nowrap;
    line-height: 1.6;
}

.pill-group.compact .pill {
    padding: 1px 7px;
    font-size: 0.78em;
}

.pill:hover:not(.active) {
    background: rgba(255,255,255,0.10);
    color: var(--font-color);
}

.pill.active {
    background: rgba(255,255,255,0.14);
    color: var(--font-color);
    box-shadow: 0 1px 3px rgba(0,0,0,0.35);
}

.pill.active.accent {
    background: color-mix(in srgb, var(--font-color-accent) 22%, transparent);
    color: var(--font-color-accent);
    box-shadow: 0 1px 3px rgba(0,0,0,0.35);
}

.pill.active.danger{
    background: color-mix(in srgb, var(--color-danger) 18%, transparent);
    color: var(--color-danger);
    box-shadow: 0 1px 3px rgba(0,0,0,0.35);
}
</style>
