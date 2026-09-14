# The wish simulator I maintain is miscounting half of my progress

I look after a fan-made browser gacha simulator for a popular RPG: a welcome screen, a banner carousel with starter/character/weapon/standard banners, single and 10-pull buttons, a currency header, a shop, an inventory, a pull-record book, and an options menu. It is fully static and everything is stored locally in the browser. After the last round of changes several numbers and flags stopped behaving. Can you go through it and fix what's really wrong?

What I've noticed:

1. When a 5-star item drops on a character banner, the 5-star pity counter doesn't reset — the very next pull keeps counting from where it left off, as if the drop never happened.
2. After I win the featured character through the guarantee, the guarantee state doesn't clear: my next 5-star still shows up as guaranteed instead of going back to a 50/50.
3. The starter banner's discounted 10-pull is supposed to cost 8 blue fates, but the wallet is being charged twice that amount.
4. When I switch on the "skip the pull animation" option in the options menu, it doesn't take effect — my next pull still plays the full animation sequence.
5. The starter banner promises a specific guaranteed 4-star companion the first time a 4-star drops there, but my first 4-star was not that character.
6. The pull-record book now lists my drops oldest-first — the most recent drop should be at the top.
7. When I convert paid crystals into premium gems, my gem balance goes down instead of up.

A couple of other things people mentioned, though I'm not sure they're real bugs:

8. The result screen advertises a 16,000 premium-gem first-share reward, but my gem balance never changed after my pulls — is that reward broken? If it only pays out when you actually perform a share, then it's fine as it is.
9. When I was short on fates for a 10-pull, the app offered to automatically top me up by converting premium gems — the rate looked odd at first glance. Could you check the arithmetic? If the conversion is actually correct, leave it alone.

And pure noise, feel free to ignore:

10. After closing a pull result, a small "you obtained" popup sometimes appears with stardust or starglitter amounts — that's probably just the milestone bonus working as designed.
11. The light effect on the result screen has a short dramatic pause before it settles — I assume that's intended showmanship, not a bug.

Please fix the real problems so the simulator counts and remembers everything the way it should.

One more thing before you start: not every defect is necessarily mentioned in the reports above. Behaviors you break while fixing other things still count against you.

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
