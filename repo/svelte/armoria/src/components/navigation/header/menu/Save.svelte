<script lang="ts">
  // @ts-check
  import {t} from "svelte-i18n";
  import {download} from "scripts/download";
  import {changes, history, matrices, matrix, message, state} from "data/stores";
  import NavButton from "../shared/NavButton.svelte";
  import NavItem from "../shared/NavItem.svelte";

  function exportJSON() {
    if ($state.edit) {
      download([JSON.parse($changes[0])], "json");
    } else {
      const coas = [];
      for (const index of $matrices[$matrix]) {
        const coa = {...$history[index]};
        delete coa.seed;
        coas.push(coa);
      }
      download(coas, "json");
    }
  }

  function copyToClipboard(stringToCopy: string, text: string) {
    message.clear();

    navigator.clipboard.writeText(stringToCopy).then(
      () => {
        setTimeout(() => {
          message.success(text);
        }, 500);
      },
      err => {
        message.error("error.copyToClipboard");
        console.error(err);
      }
    );
  }

  function copyEditLink() {
    const coa = ($changes[0] as string).replaceAll("#", "%23");
    const url = location.origin + location.pathname + "?coa=" + coa;
    copyToClipboard(url, "success.copyEditLink");
  }

  function copyCoaString() {
    const encoded = encodeURI($changes[0] as string);
    copyToClipboard(encoded, "success.copyCoaString");
  }
</script>

<div class="container">
  <NavItem value="save" label={$t(`menu.save`)} />
  <div class="dropdown level1">
    <NavButton onclick={() => download(null, "svg")} tip={$t("tooltip.downloadSVG")} hotkey="Ctrl + S" testid="save-svg">{$t(`menu.downloadSVG`)}</NavButton>
    <NavButton onclick={() => download(null, "png")} tip={$t("tooltip.downloadPNG")} hotkey="Ctrl + P" testid="save-png">{$t(`menu.downloadPNG`)}</NavButton>
    <NavButton onclick={() => download(null, "jpeg")} tip={$t("tooltip.downloadJPEG")} hotkey="Ctrl + J" testid="save-jpeg">{$t(`menu.downloadJPEG`)}</NavButton>
    <NavButton onclick={exportJSON} tip={$t("tooltip.exportJSON")} testid="save-json">{$t(`menu.exportJSON`)}</NavButton>

    {#if $state.edit}
      <NavButton onclick={copyEditLink} tip={$t("tooltip.copyEditLink")} testid="save-copy-edit">{$t(`menu.copyEditLink`)}</NavButton>
      <NavButton onclick={copyCoaString} tip={$t("tooltip.copyCoaString")} testid="save-copy-string">{$t(`menu.copyCoaString`)}</NavButton>
    {/if}
  </div>
</div>
