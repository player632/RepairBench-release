<script lang="ts">
    interface RadioOption {
        label: string;
        value: string;
    }

    interface Props {
        value: string;
        options: RadioOption[];
        name?: string;
        onchange?: (checked: string) => void;
    }

    // eslint-disable-next-line prefer-const
    let {value = $bindable(), options, name, onchange}: Props = $props();

    // Fallback so radios are still grouped when no explicit name is provided.
    const uid = $props.id();
    const groupName = $derived(name ?? uid);

    function change(optValue: string) {
        value = optValue;
        if (onchange) onchange(optValue);
    }
</script>


<div class="radio-group" role="radiogroup">
    {#each options as option (option.value)}
        <label class="radio" class:checked={value === option.value} aria-checked={value === option.value}>
            <input class="radio-input" type="radio" name={groupName} checked={value === option.value} onchange={() => change(option.value)} />
            {option.label}
        </label>
    {/each}
</div>


<style>
.radio-group {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
}

.radio {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    cursor: pointer;
}

.radio.checked::before {
    content: "";
    position: absolute;
    width: 7px;
    height: 7px;
    left: 4px;
    top: 5px;
    border-radius: 50%;
    background: #fff;
}

.radio-input {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    -webkit-appearance: none;
    appearance: none;
    box-sizing: border-box;
    flex: 0 0 auto;
    margin: 0;
    border-radius: 50%;
    background: linear-gradient(0deg, #615E65, #4E4B53);
    width: 15px;
    height: 15px;
    border: 0;
    box-shadow:
            0px 0px 1px 0px #000000,
            inset 0px 3px 1px -3px rgba(255, 255, 255, 0.65);
}

.radio-input:active {
    filter: brightness(1.2);
}

.radio-input:checked {
    background: linear-gradient(0deg, #3C6EC9, #437AE2);
}

.radio-input::marker {
    display: none;
}
</style>