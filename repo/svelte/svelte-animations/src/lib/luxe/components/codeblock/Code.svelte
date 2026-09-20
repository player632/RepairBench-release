<script lang="ts">
  import { codeToHtml } from "shiki";
  import { onMount } from "svelte";
  import { fade, slide } from "svelte/transition";

  export let code = "";
  export let lang = "svelte";
  let htmlCode: any = "Loading...";
  onMount(() => {
    htmlCode = codeToHtml(code, {
      lang: `${lang}`,
      theme: "vesper",
    });
  });
</script>

{#key htmlCode}
  <div in:fade data-testid="rb-code">
    {@html htmlCode}
  </div>
{/key}
