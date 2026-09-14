# Repair Task - blockhead (SvelteKit + TypeScript)

You are working on the source code of **Blockhead**, the landing page of an
open-source crypto / DeFi / web3 dashboard built with SvelteKit, TypeScript and
vite. The wider product has a portfolio tracker, a block explorer and a dapp
browser behind it, but the face you are repairing is the site's front door: one
statically prerendered route at "/", with no account, no wallet connected and
no blockchain data loaded. Everything described below is on that single page.

Reading the page top to bottom:

- A header bar. On the left the "Blockhead" wordmark, linking to "/", then
  three links - Portfolio, Explorer, Apps - with the one for the page you are
  on marked as current for assistive technology. On the right, at desktop
  width, two small social buttons (Farcaster and Twitter) sitting together in
  their own toolbar; beside them a "Wallets" checkbox whose label carries a
  small arrow glyph after the word (pointing down while closed, up while open).
- A hero: the Blockhead logo, a headline in which the words "Track",
  "visualize", "explore" and "decentralized world wide web" are set bold, and a
  "Learn more ﹀" line beneath.
- A grid of six feature cards, each with a heading and a rule: "Track your
  crypto", "Visualize your activity", "Explore the metaverse", "Unstoppable
  Web3 Tech", "You control the data", "To Ethereum & Beyond!".
- A feedback and sign-up card headed "Leave feedback + stay updated!". It asks
  for a name, a required email address, an Ethereum address, an optional
  referral, a choice of twelve "which of these describes you" checkboxes, a
  free-text message, and a "Sign up ›" button. The address box accepts either an
  ENS name (`vitalik.eth`) or a `0x…` hex address, and announces which of the
  two it recognised; a fully recognised hex address is additionally rendered in
  the monospace face so the digits are readable. Submitting posts the form to
  the site's own root and replaces the card with a "Thank you" panel signed
  "– Darryl", which offers a way back to the form.
- A footer: "Blockhead • created by Darryl Yeo • 2020 – 2025", with Farcaster
  and Twitter links.
- Fixed to the bottom of the viewport, a "Preferences" bar. It opens showing
  only three settings - Currency, Node Client and Theme - and an icon-only
  button whose glyph reads "· · ·". Pressing that button expands the bar to the
  whole catalogue of 23 settings grouped under seven named headings, changes the
  glyph to "✓" and adds a "Reset All" button; pressing it again collapses back
  to the three. The Theme setting offers three options, and the first of them
  reads "Auto (Light)" or "Auto (Dark)" according to the operating system's own
  colour-scheme preference at the moment the page renders.
- Parked off the right edge, a wallets/account panel that stays out of the way
  until the Wallets checkbox is ticked. When it opens it slides into view and
  the main column narrows and gains right-hand padding to make room for it.

The project builds with vite through SvelteKit's static adapter (output in
`build/`, which is what the verifier serves from the site root). Dependencies
are provisioned offline by the harness, and the page makes no network request
to any other origin at runtime.

Environment notes - properties of this offline harness, not defects:

- There is no network access. The wider product talks to thirty-odd blockchain
  data providers, but nothing on this page calls any of them, and no
  stylesheet, font, script, image or analytics tag is fetched from another
  origin. The feedback form's submit does post to the site's own root, and the
  offline static server answers that locally - which is all the page needs in
  order to reach its "Thank you" state.
- The harness drives the app in a real browser at a **1440x900 viewport** with
  an `en-US` locale. That is a desktop width, well above the header's collapse
  breakpoint, so the header is in its wide layout here: its disclosure trigger
  is not rendered at all at this width, and the social buttons sit directly in
  the bar. Layouts at other widths are out of scope for this task.
- The browser context reports `prefers-color-scheme: light` and nothing
  overrides it, so anything the page derives from that media query has one
  stable answer throughout.
- Generated identifiers are reproducible: the harness pins this app's entropy
  sources to a fixed seed, so any identifier the page mints comes out the same
  on every run and every machine. That is a property of the test environment
  and not something to undo.
- Every checkpoint starts from a fresh browser context. The page does keep its
  preferences in a single local-storage entry, so inside one checkpoint a
  change you make can persist and be read back - but nothing carries over from
  one checkpoint to the next.
- The harness spoofs a desktop user-agent string. This project never branches
  on the user agent, so that has no effect on anything you see here.
- The page uses short enter and exit transitions (200-300 ms) on the
  preferences bar, the wallets panel, the feedback card and its "Thank you"
  replacement. Readings are taken after those have settled.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different module
  than the one the symptom appears in, and a single reported symptom can have
  more than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break
  while fixing other things still count against you.
- Do not remove, rename or repurpose any `data-rb-*` attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "the Preferences bar along the bottom comes up already blown wide open.
   Every single setting is listed - two dozen of them, under seven headings -
   with a 'Reset All' button and a tick on the little round button. It used to
   open with just the three essentials (currency, node client, theme) and three
   dots on that button, and you had to press it to see the rest."

2. "on a normal desktop-width window the Farcaster and Twitter buttons have
   vanished out of the header. They aren't tucked behind anything - the group
   they sat in simply isn't there, and the header is two links shorter than it
   should be. Narrow the window right down and the header still puts them up,
   so it's the wide layout that lost them."

3. "ticking Wallets does nothing you can see. The little arrow flips to point
   up, so the page clearly believes the panel is open, but no panel ever slides
   in from the right and the page never shifts over to make room for one.
   Untick it, tick it again - same thing every time."

4. "the feedback form at the bottom eats my submission. I type in my email,
   press 'Sign up ›', get a brief 'Submitting…', and then I'm staring at an
   empty form again. No thank-you note, no confirmation, and everything I typed
   is gone. It used to finish on that thank-you card signed by Darryl."

5. "the first entry in the Theme dropdown lies to me. My whole system is in
   light mode and the page is plainly rendering light, yet the option reads
   'Auto (Dark)'. Choosing Dark or Light by hand works fine - it's only the
   automatic one that has it backwards."

6. "pasting my wallet address into the address box on the feedback form doesn't
   do anything special any more. It used to be recognised as an address and
   switch to the monospace font, which is the only way I can actually read the
   hex; now it just sits there in the regular font like any other text. An ENS
   name still seems to be picked up correctly."

7. "This might just be me not knowing how the form is wired, but: there are TWO
   forms in this page answering to the name 'contact', and one of the fields in
   the visible one is a text box named after the project itself that you can
   never see. Is that leftover debug markup that ought to be cleaned up, or is
   it there on purpose?"

8. "Following on from the address box: I pasted a whole line of text that had
   my address in the middle of it - 'see 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   on etherscan' - and the field kept the entire sentence instead of pulling
   the address out of it. Is digging an address out of pasted prose something
   it's meant to do, or is one-address-per-field the rule?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the header's link set and its marking of the current page, the hero
and the six feature cards, the footer, the whole 23-setting preference
catalogue and what the page persists about it, the wallets panel's open and
closed contract, the disclosure component's expanded/collapsed signalling, the
address box's recognition of an ENS name and of a partial or invalid entry, and
the way the page picks up a preference that was changed in another tab - none
of which any single report describes in full. The project must still build with
the command above when you are done.
