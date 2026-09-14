<script lang="ts">
  import ogImage from '$lib/assets/og_image.jpg';
  import type { Snippet } from 'svelte';
  import '../app.css';
  import '$lib/instrumentationProbe';

  let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <title>Plinko</title>
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Plinko" />
  <meta property="og:url" content="https://plinko-web-game.netlify.app/" />
  <meta property="og:image" content={ogImage} />
</svelte:head>

{@render children?.()}
