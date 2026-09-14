<script lang="ts">
  export let size: number;

  import { running } from '../../states';

  const steps = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];

  if (!steps.includes(size)) {
    // find the closest size to steps
    size = steps.reduce((prev, curr) =>
      Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
    );
  }
</script>

<label class="form-control w-full mb-2" data-testid="size-picker-pow2">
  <div class="label">
    <span class="label-text">Array size</span>
    <span class="label-text-alt" data-testid="size-label">{size} bars</span>
  </div>
  <div class="join">
    {#each steps as value}
      <input
        name="options"
        class="join-item btn btn-sm h-5 min-h-5"
        aria-label={value.toString()}
        disabled={$running}
        type="radio"
        {value}
        data-testid={`size-pow2-${value}`}
        data-active={value === size ? 'true' : 'false'}
        bind:group={size}
      />
    {/each}
  </div>
</label>
