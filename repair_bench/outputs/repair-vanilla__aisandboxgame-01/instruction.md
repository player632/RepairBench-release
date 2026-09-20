# Repair Task — AI Sandbox Game (vanilla JavaScript interactive-fiction sandbox)

## The product

AI Sandbox Game is a browser-based workbench for authoring and playing interactive-fiction
"world cards". A world card bundles a setting, its characters, an opening greeting and the
rules a play session runs under; the app lets you design one, preview it, and keep a rolling
history of saved sessions.

It is a plain static tree: one entry page plus a folder of scripts, each of which publishes a
single global. There is no bundler, no transpile and no build step, and there is no server —
the whole product is meant to run from the files alone, with the network unreachable. Nothing
in the intended behaviour depends on a remote service, on an API key, or on a background worker
being registered.

## How the behaviour is organised

Five areas own almost everything a player touches, and the reports below are spread across all
of them:

- **Navigation.** One service owns which main screen is showing, which tab inside that screen
  is showing, and which side panel is open. The main screen and the side panel are independent:
  moving between main screens must not drag the side panel along. Every main screen has a
  defined starting tab, so arriving at a screen always shows the tab that screen is supposed to
  open on rather than whatever tab was selected the last time you were there. The side panel a
  user picks is meant to be remembered for that app mode, so a reload brings it back.
- **Appearance.** One service owns the colour mode, the background mode, the interface scale
  used on very large displays, and the geometry of a custom background image inside its frame.
  A custom background is specified to *cover* the frame: it scales up until the frame is full,
  cropping the overflow, rather than shrinking to fit inside it and leaving bare stripes. One
  background option — the paper-textured one — is a pale surface, and the app treats it as
  readable only against the bright colour mode.
- **Card formats.** One module knows the newest card format this build can read, and can answer
  two different questions about a card: what format it is in *now*, and what format it was
  *originally authored* in. Those two answers diverge on purpose once a card has been upgraded,
  and the editor relies on the second one to decide how to present an old card. A card whose
  format is newer than what this build reads is genuinely from the future and must be refused;
  a card this build wrote itself is not.
- **Upgrades.** One entry point upgrades an authored card in memory, calling the individual
  upgrade steps. Upgrading is meant to be safe to repeat: running it over a card that is
  already in the newest format must hand the card back untouched, including any choices the
  author curated by hand. Upgrading is also meant to be conservative about content — it moves
  a value from an older location to a newer one only when the newer location does not already
  hold real content, and it never deletes fields it does not understand.
- **Save history.** Saved sessions live in a fixed-capacity ring. Adding to a full ring drops
  the oldest entry that is not pinned; entries the user pinned, and the labels on them, are
  never touched. When several entries share the same timestamp, the one that was added first is
  the one that goes.

## What users and testers reported

These are the reports that came in. They are observations, not diagnoses, and they are not
ordered by cause.

**Report 1 — "The side panel tabs are dead."**
Clicking any side-panel tab does nothing. The panel never appears, no matter which tab is
clicked, and it is not a styling or z-order problem — the panel simply is not there. Reproduces
on every fresh load.

**Report 2 — "The side panel is forgotten when I reload."**
On the occasions the tester could get a side panel open at all, the choice did not survive a
reload: after refreshing, the side panel was back to the one the app starts with instead of the
one that had been chosen. Browser storage was checked directly and held nothing for it. This
report may be downstream of Report 1 — the tester could not always tell.

**Report 3 — "Custom backgrounds have bars down the sides."**
With a custom background image whose proportions differ from the frame's, the image now sits
inside the frame with bare stripes showing, instead of filling it. It looks like the picture was
fitted rather than spread. Reproduced with a wide frame and a narrower image, and with the
zoom control left at its starting value.

**Report 4 — "The paper background is unreadable."**
Choosing the paper-textured background while the dark colour mode is on leaves the dark mode on.
The result is a pale paper surface with text that was coloured for a dark surface, so the
setting is effectively unusable. Selecting any other background while in dark mode is fine and
should stay fine.

**Report 5 — "Every card is refused as being from a newer version."**
Cards that this very build produced are now turned away with the message reserved for cards from
a format this build cannot read yet. The library is unopenable. Cards that really are from a
newer format still have to be refused — that warning is the only thing standing between a user
and a silently corrupted save.

**Report 6 — "The opening greeting comes up empty."**
Some cards open with an empty greeting box even though a greeting was authored for them. The
affected cards are ones where the greeting text lives in the older authored location and the
newer location is present but holds nothing but blank characters. Cards with no greeting at all,
and cards whose newer location holds real text, behave correctly.

**Report 7 — "The wrong save gets dropped."**
When two saves land in the same instant — which happens when a session is saved twice in quick
succession — the history keeps the wrong one. The entry that should have been dropped is still
there and a different one is gone. With saves at clearly distinct times the history is correct.

**Report 8 — "Sometimes it opens in the wrong theme, or remembers the wrong side panel."** *(not a defect)*
This one was chased and closed as a misunderstanding. On a profile that has never been used,
there is no stored preference to mis-read: the app always comes up in the bright colour mode,
the side panel is always the one the app starts with, and nothing at all is written to browser
storage until the user actually chooses something. There is no wrong theme and no stale panel
being recalled — the reporter had been comparing against a profile they had used before. The
cold-start behaviour is correct and must stay exactly as it is.

**Report 9 — "Old cards lose their character data after an upgrade."** *(not a defect)*
Also closed as a misunderstanding. Upgrading a card that carries per-character format stamps
from the older layout does drop those stamps — but that is the intended behaviour, because the
newer format records the format once for the whole card instead of once per character. The
character's name and every other authored field survive the upgrade intact. Nothing authored is
lost, and the per-character stamp must keep being dropped.

## Read this before you start

**Not every defect is necessarily mentioned in the reports.** The reports above are what users
happened to notice. Several of the faults in this tree are in behaviour nobody filed a report
for, and a few are only visible in an edge case — a boundary value, a repeated operation, a
format stamp that is read from the wrong place, a version number that governs what gets written.
Repairing only the seven reported symptoms will leave the task unfinished. Go through each of
the five areas above against the code and decide for yourself which behaviours are wrong.

Equally, two of the nine reports are explicitly *not* defects. Do not "fix" the cold-start
behaviour in Report 8 or the per-character stamp removal in Report 9; both are correct as they
stand, and changing either is a regression.

## Ground rules

- Work only inside this tree. The network is unreachable and must stay that way: no outbound
  request, no remote asset, no CDN, and no background worker may end up controlling the page.
  The app has to keep working from the files alone.
- Repair behaviour. Do not add markup attributes, element ids, hooks, test-only globals or
  anything else whose purpose is to make a check observe something the product does not really
  do.
- Do not weaken a guard to make a symptom disappear. Where a report says a refusal is correct in
  some cases (Report 5) or that a behaviour must stay as it is (Reports 8 and 9), the refusal and
  the behaviour have to keep working.
- Keep every module's published surface intact: the globals the app publishes, the names and
  shapes of the methods on them, the navigation map, the interface-scale values, the storage key
  layout and the card format numbers are all part of the product's contract and are not yours to
  redesign.
- No new dependency, no build step, no transpile, no minifier. The tree has to stay a plain
  static tree that runs from the files.
- Keep the edits surgical. Nothing in this task requires restructuring a module, moving code
  between files, or rewriting a function that is merely adjacent to a broken one.

## What "repaired" means

Every one of the five areas behaves the way its description above says it does, whether or not
anybody filed a report about it:

- arriving at a main screen shows that screen's own starting tab, and the side panel is left
  alone by main-screen changes;
- a side panel opens when its tab is clicked, refuses cleanly when it genuinely is not available
  in that app mode, and the choice is remembered across a reload;
- a custom background covers its frame, and the layout computation stays a pure computation that
  does not write back into the stored background settings;
- the pale paper background is legible, and every other background leaves the colour mode alone;
- the interface scale ladder gives the intended value on very large displays *and* keeps the
  values it already gives on ordinary ones;
- a card this build wrote is accepted, a card from a genuinely newer format is still refused, and
  a card that was authored in the oldest format is still recognised as such after it has been
  upgraded;
- newly written saves carry the newest format this build reads, upgrading an already-upgraded
  card leaves it untouched, upgrading never deletes a field it does not understand, and a
  blank-only value in the newer location does not block the authored text from being carried
  over;
- the save history still drops the oldest unpinned entry, drops the first-added one when
  timestamps tie, and never disturbs a pinned entry or its label;
- and nothing else changed: cold start, the offline guarantee, the shell of the page, and the two
  behaviours Reports 8 and 9 describe as correct all read exactly as they do now.
