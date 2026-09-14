<script lang="ts">
  export let size: number;

  import { running } from '../../states';
</script>

<label class="form-control w-full mb-2" data-testid="size-picker-range">
  <div class="label">
    <span class="label-text">Array size</span>
    <span class="label-text-alt" data-testid="size-label">{size} bars</span>
  </div>
  <input
    id="size"
    name="size"
    class="range range-sm range-primary"
    disabled={$running}
    max="1024"
    min="2"
    type="range"
    data-testid="size-input"
    bind:value={size}
  />
</label>
