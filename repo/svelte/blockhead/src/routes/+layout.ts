// Polyfills

import process from 'process'
import { Buffer } from 'buffer'

globalThis.global = globalThis
globalThis.Buffer = Buffer
globalThis.process = process

import fromAsync from 'array-from-async'
Array.fromAsync ||= fromAsync


// Shims
import shimMapGroupBy from 'map.groupby'
shimMapGroupBy.shim()

import shimObjectGroupBy from 'object.groupby'
shimObjectGroupBy.shim()

import shimRegexpEscape from 'regexp.escape'
shimRegexpEscape.shim()

import shimSetDifference from 'set.prototype.difference'
shimSetDifference.shim()


// ---------------------------------------------------------------------------
// ADAPTATION (repair-bench, environment/adaptation.patch) - deterministic platform entropy.
//
// WHY THIS IS HERE, AND WHAT THE FACE MEASUREDLY DOES WITH IT. The seed draws every generated DOM
// identifier from the platform CSPRNG: crypto.randomUUID() is CALLED - not merely named in a
// "ReturnType<typeof ...>" type position - at exactly six places in src/, five of them in this
// face's module closure. MEASURED, NOT ASSUMED (leg BHdiag: 1440x900 static serve of the built
// face, every [id] element attributed from the DOM and mapped back to its draw index; identical in
// all 28 fixture scenarios) the landing face spends exactly FOUR draws:
//   Collapsible.svelte:36 const buttonId = crypto.randomUUID() -> #1. Document-visible ONLY as for=
//     on the trigger div (:197, the type==='label' spread), never as an id: the id=:222 that would
//     carry it is inside the {#if canToggle} gate at :216, and canToggle is $hasCollapsedNavigation
//     (CollapsibleToolbar.svelte:14-15, passed at :22), false above the 30rem breakpoint that
//     Nav.svelte:20 declares. Hence firstCollapsibleTriggerId() '', ariaIdShapeOk() false and
//     triggerForResolves() false - the for= dangles.
//   Collapsible.svelte:37 const ariaId = crypto.randomUUID() -> #2. DOES become an id, on the
//     content div at :247, whose ONLY gate is type==='label' at :246; canToggle does not guard it,
//     and Nav.svelte:19 does pass type="label". This is what firstUuidShapedId() returns.
//   Datalist.svelte:14 export const datalistId = crypto.randomUUID() -> #3. Document-visible ONLY
//     as the address input's list= attribute (AddressInput.svelte:96); {#if list?.length} at :18 is
//     shut (suggestions empty at boot) so the <datalist> at :19 never renders, datalistCount is 0,
//     list= dangles and addressDatalistResolves() reads false. The draw is still spent.
//   Dialog.svelte:3 export let id: string = crypto.randomUUID() -> #4. DOES become an id, on the
//     popover div at :33 (plus a resolving popovertarget= at :21), via SharePageDialog.svelte:21
//     from +layout.svelte:298-300, rendered because metaTags.openGraph.images[0] exists.
//   SearchInput.svelte:55 is not in the closure and never draws; state/account.ts:52 draws only on
//     an added connection and that id stays in the store, so the census is 2 in those scenarios too.
// NET, in all 28 scenarios: uuidShapedIdCount() === 2 (#2 and #4), idCount() === 6 - those two plus
// static #top, #contact, #preferences-button, #svelte-announcer - and firstUuidShapedId() is draw
// #2, replayable offline from the seed constant: a REPRODUCIBILITY guarantee, not a drifting value.
//
// WHAT IS REPLACED, AND WHAT IS NOT. Only the two platform entropy SOURCES are replaced, here,
// once, at the single earliest client module of the graph:
//   crypto.randomUUID  -> a seeded mulberry32 stream rendered as an RFC-4122-shaped v4 string
//   Math.random        -> the same seeded stream
// It is the mulberry32 the delivered solid sibling package uses
//
// same golden-ratio constant 0x9e3779b9, so the sequence is byte-identical across runs, machines
// and browser contexts, and each dsl_runner checkpoint's fresh context restarts it, as the CSPRNG did.
//
// NOT ONE CALL SITE IS TOUCHED. All six crypto.randomUUID() call sites above, and both live
// Math.random() call sites in src/ - src/components/EnsDomain.svelte:374 and src/api/audius.ts:186;
// a third, src/components/Nft.svelte:46, is commented out in the seed and stays so - remain
// BYTE-IDENTICAL, so the seed's own entropy-consuming surface is preserved for the answering agent
// to read. No rule, threshold, density, shape, default, selector, layout or data value is altered:
// a draw is still a unique 36-character v4-shaped string within a run (version nibble forced to 4,
// variant nibble to 8/9/a/b, exactly like the platform's), and still a float in [0, 1).
//
// WHY Math.random TOO, WHEN NO READING ON THIS FACE CONSUMES IT. The closure holds no live
// Math.random() call, so pinning it cannot move a reading here; it guarantees none can drift if the
// agent's fix reaches a component that does call it. Both pins are unconditional and guarded, and
// both carry an __rbEntropyPin marker the bridge reads back, so "live in THIS bundle" is a reading.
// ---------------------------------------------------------------------------
let rbEntropySeed = 0x9e3779b9

const nextDeterministicRandom = () => {
	rbEntropySeed = (rbEntropySeed + 0x6d2b79f5) | 0

	let t = Math.imul(rbEntropySeed ^ (rbEntropySeed >>> 15), 1 | rbEntropySeed)

	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

	return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const deterministicRandomUUID = () => {
	const nibbles = Array.from({ length: 32 }, () => Math.floor(nextDeterministicRandom() * 16).toString(16))

	// RFC 4122 version 4 / variant 10xx, so the string is shaped exactly like the platform's
	nibbles[12] = '4'
	nibbles[16] = ((parseInt(nibbles[16]!, 16) & 0x3) | 0x8).toString(16)

	const hex = nibbles.join('')

	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

try {
	if(globalThis.crypto)
		Object.defineProperty(globalThis.crypto, 'randomUUID', {
			value: deterministicRandomUUID,
			writable: true,
			configurable: true,
		})
} catch(e) { /* a context that seals crypto keeps the platform CSPRNG; the face needs neither */ }

try {
	globalThis.Math.random = nextDeterministicRandom
} catch(e) { /* ditto */ }

// Measurable pin markers. A property on the REPLACED function, so the app can never observe it and
// no behaviour changes; the instrumentation bridge reads it back, which turns "the adaptation is
// live in this bundle" from an assumption into a reading on every one of the four states.
try { (globalThis.crypto?.randomUUID as any).__rbEntropyPin = 'mulberry32/0x9e3779b9' } catch(e) { /* ditto */ }
try { (globalThis.Math.random as any).__rbEntropyPin = 'mulberry32/0x9e3779b9' } catch(e) { /* ditto */ }


// SvelteKit

export const prerender = 'auto'

const isStatic = !!process.env.SVELTE_BUILD_STATIC
export const trailingSlash = isStatic ? 'always' : 'never'


// Types/constants
import type { MetaTagsProps } from 'svelte-meta-tags'


// Context
import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
	const metaTags: MetaTagsProps = {
		title: `Blockhead`,
		description: `Track, visualize & explore all of crypto, DeFi & web3 with Blockhead's crypto portfolio tracker, cross-EVM block explorer, and interfaces for your favorite dapps and web3 infrastructure.`,
		openGraph: {
			type: 'website',
			url: 'https://blockhead.info',
			title: `Blockhead | track, visualize & explore all of crypto, DeFi & web3`,
			description: `Track, visualize & explore all of crypto, DeFi & web3 with Blockhead's crypto portfolio tracker, cross-EVM block explorer, and interfaces for your favorite dapps and web3 infrastructure.`,
			images: [
				{
					url: 'https://blockhead.info/Blockhead@1-1728x1080.png',
					width: 1728,
					height: 1080,
					alt: 'Blockhead | track, visualize & explore all of crypto, DeFi & web3'
				},
			],
			siteName: 'Blockhead | track, visualize & explore all of crypto, DeFi & web3',
		},
		twitter: {
			handle: '@darryl__yeo',
			site: '@0xBlockhead',
			cardType: 'summary_large_image',
			title: `Blockhead・track, visualize & explore all of crypto, DeFi & web3・B⃞`,
			description: `EVM networks, blocks, txs, accounts, contracts, dapps, NFTs, web3 infra`,
			// description: `EVM networks/blocks/txs/accounts/contracts/dapps/NFTs/infra & more`,
			image: 'https://blockhead.info/Blockhead@1-1728x1080.png',
			imageAlt: 'Blockhead | track, visualize & explore all of crypto, DeFi & web3',
		},
		additionalLinkTags: [
			{
				rel: 'icon',
				href: '/favicon.png',
			},
			{
				rel: 'apple-touch-icon',
				href: '/logo-192.png',
				sizes: '192x192',
			},
			{
				rel: 'apple-touch-icon',
				href: '/logo-512.png',
				sizes: '512x512',
			},
			{
				rel: 'manifest',
				href: '/manifest.json',
			},
		],
	}

	return {
		metaTags,
	}
}
