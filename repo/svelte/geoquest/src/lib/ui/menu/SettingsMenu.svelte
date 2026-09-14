<script lang="ts">
    import {showFlagOnly, showTimer} from '$lib/store'
    import {availableLocales, t} from '$lib/translations'
</script>

<div class="flex flex-col">
    <div data-testid="settings-panel" class="flex flex-col mb-4 justify-between gap-2">
        <div class="flex flex-wrap text-lg bg-foreground p-3 rounded items-center">
            <input data-testid="flags-only-checkbox" id="displayFlagOnly" class="form-checkbox h-6 w-6 rounded text-gray focus:ring-0 focus:ring-offset-0 transition cursor-pointer" type="checkbox" checked={$showFlagOnly} />
            <label for="displayFlagOnly" class="ml-2 cursor-pointer">{$t('ui.flagsOnly')}</label>
        </div>
        <div class="flex flex-wrap text-lg bg-foreground p-3 rounded items-center">
            <input data-testid="timer-checkbox" id="showTimer" class="form-checkbox h-6 w-6 rounded text-gray focus:ring-0 focus:ring-offset-0 transition cursor-pointer" type="checkbox" bind:checked={$showTimer} />
            <label for="showTimer" class="ml-2 cursor-pointer">{$t('ui.showTimer')}</label>
        </div>
        <div class="flex flex-wrap gap-2 text-lg bg-foreground p-3 rounded items-center">
            <!-- Each of the language names is only directly written in their own language -->
            {#each Object.entries(availableLocales) as [locale, [name, flag]] (locale)}
                <a data-testid="locale-link" href="/{locale}"> <button>{flag} {name}</button></a>
            {/each}
        </div>
    </div>
</div>
