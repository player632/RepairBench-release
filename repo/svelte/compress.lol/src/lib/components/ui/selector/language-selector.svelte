<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';
	import Languages from '@lucide/svelte/icons/languages';
	import { browser } from '$app/environment';

	type Locale = (typeof locales)[number];
	const currentLang = getLocale();

	function toFlag(region?: string): string {
		if (!region) return '🌐';
		return region
			.toUpperCase()
			.replace(/[^A-Z]/g, '')
			.split('')
			.map((c) => String.fromCodePoint(0x1f1e6 + (c.charCodeAt(0) - 64)))
			.join('');
	}

	function regionToTwemojiSvg(region?: string): string | null {
		// RepairBench environment adaptation (offline face). The seed returned a REMOTE sprite URL
		// (https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/<codepoints>.svg), which this seat
		// measured as the only non-same-origin request the application makes
		//
		// Returning null is the seed's OWN "no sprite" branch: {#if flagSrc} renders the <img>, {:else}
		// renders the Unicode regional-indicator emoji built by toFlag() above, so the selector shows the
		// same information with zero remote hosts. No other behaviour is touched.
		void region;
		return null;
	}

	function getRegionFromLocale(tag: string): string | undefined {
		try {
			const loc = new Intl.Locale(tag).maximize?.() ?? new Intl.Locale(tag);
			const base = tag.split('-')[0].toLowerCase();
			if (base === 'en') return 'GB';
			return loc.region;
		} catch {
			return tag.split('-')[0].toLowerCase() === 'en' ? 'GB' : undefined;
		}
	}

	const languageNames = new Intl.DisplayNames([currentLang || 'en'], { type: 'language' });
	const languages = locales.map((l) => {
		const region = getRegionFromLocale(l);
		const name = languageNames.of(l);
		return {
			value: l,
			label: name ? name.charAt(0).toUpperCase() + name.slice(1) : l.toUpperCase(),
			flag: toFlag(region),
			flagSrc: regionToTwemojiSvg(region)
		};
	});

	function handleLanguageChange(value: string | undefined) {
		if (value && browser && locales.includes(value as Locale)) {
			setLocale(value as Locale, { reload: true });
		}
	}
</script>

<Select.Root type="single" value={currentLang} onValueChange={handleLanguageChange}>
	<Select.Trigger class="flex h-8 w-20 items-center gap-2" data-testid="rb-lang-trigger">
		<Languages class="h-4 w-4" />
		{#if languages.find((lang) => lang.value === currentLang)?.flagSrc}
			<img
				src={languages.find((lang) => lang.value === currentLang)!.flagSrc}
				alt=""
				class="h-4 w-4 object-contain"
				aria-hidden="true"
			/>
		{:else}
			<span
				class="inline-flex h-4 w-4 items-center justify-center text-base leading-none"
				style="font-variant-emoji: emoji;"
			>
				{languages.find((lang) => lang.value === currentLang)?.flag}
			</span>
		{/if}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			{#each languages as lang}
				<Select.Item value={lang.value}>
					<div class="flex items-center gap-2">
						{#if lang.flagSrc}
							<img src={lang.flagSrc} alt="" class="h-4 w-4 object-contain" aria-hidden="true" />
						{:else}
							<span
								class="inline-flex h-4 w-4 items-center justify-center text-base leading-none"
								style="font-variant-emoji: emoji;">{lang.flag}</span
							>
						{/if}
						<span>{lang.label}</span>
					</div>
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
