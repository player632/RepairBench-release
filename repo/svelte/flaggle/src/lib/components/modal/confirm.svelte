<script lang="ts">
  import Modal from "./modal.svelte";

  let modal: Modal;

  let {
    title,
    body,
    action,
    onaccept,
    onreject,
  }: {
    title: string;
    body: string;
    action: string;
    onaccept?: () => void;
    onreject?: () => void;
  } = $props();

  export function prompt() {
    modal.show();
  }
</script>

<Modal {title} bind:this={modal} onclose={onreject}>
  <p class="my-2 text-base-content/80">{body}</p>
  <form method="dialog" class="my-1 flex gap-2">
    <button class="btn flex-1" data-testid="confirm-cancel">Cancel</button>
    <button class="btn flex-1" onclick={onaccept} data-testid="confirm-accept">
      {action}
    </button>
  </form>
</Modal>
