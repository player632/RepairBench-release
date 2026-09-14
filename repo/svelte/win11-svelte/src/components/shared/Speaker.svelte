<script lang="ts">
  import { speaker } from "$store";
</script>

{#if $speaker > 50}
  <img
    data-testid="taskbar-speaker-icon"
    class="icon"
    src="img/icon/ui/Speaker2.svg"
    height="20"
    width="20"
    alt=""
  />
{:else if $speaker >= 0}
  <img
    data-testid="taskbar-speaker-icon"
    class="icon"
    src="img/icon/ui/Speaker1.svg"
    height="20"
    width="20"
    alt=""
  />
{:else}
  <img
    data-testid="taskbar-speaker-icon"
    class="icon"
    src="img/icon/ui/Speaker0.svg"
    height="20"
    width="20"
    alt=""
  />
{/if}
