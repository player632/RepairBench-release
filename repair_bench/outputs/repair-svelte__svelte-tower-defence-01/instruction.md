# Tower Defence — my little browser game is falling apart mid-run

Hi! I maintain a small Svelte tower-defence game that runs entirely in the browser —
no backend, no accounts, and it must never phone home anywhere. Lately it has been
misbehaving in a bunch of different ways, and my playtesters keep reporting new ones.
Some of it might be related, some might not; I honestly can't tell anymore.
Please get it all working again.

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

1. Upgrading towers feels like a scam now. I click one of my towers, the loot
   counter in the corner goes down by the upgrade cost, but the tower itself... does
   nothing. No little build animation, no visible change, and it definitely doesn't
   shoot any faster afterwards. I keep paying for upgrades that never happen.

2. I also lose loot when I click on nothing. The idea is that clicking an enemy
   zaps it and costs a bit of loot — but now, when I misclick somewhere on the empty
   background, far away from any enemy, the counter still drops. That can't be right.

3. Restarting doesn't really restart. When I hit "Restart Game" from the pause
   screen, the field resets, but my loot total from the previous run carries over —
   I've seen restarts begin with 65 loot instead of the usual 100. Old runs seem to
   leak into new ones.

4. Speaking of restart: when I restart from the pause screen, the game stays
   stuck on the pause overlay afterwards. The field behind it is fresh, but I never
   get back into the action — the pause menu just sits there.

5. The Escape key shortcut is dead. I press Esc to pause (and again to resume),
   and nothing happens at all anymore. The little pause button in the corner still
   works, so it's only the keyboard that's broken.

6. The scariest one is about my towers' shots. Once I build a tower and it
   starts firing, its shots fly at the enemies — but when they hit, nothing
   happens. No explosion, no damage. The shot just sits there on top of the enemy,
   and the longer the tower keeps firing, the more of them pile up over the
   battlefield. Tower fire feels completely useless now; my enemies only seem to
   die from anything but the shots.

7. And since yesterday one of my towers is simply missing from the field. I'm
   supposed to have four towers (two up, two down around the throne), but there are
   only three now. I never sold or lost one — it just isn't rendered anymore.

8. Also, small thing but it bugs me: on the pause screen there's a little GitHub
   icon in the corner, and when I click it nothing opens for me. I think the link is
   dead. Can you check whether that's part of whatever is going on?

9. One of my playtesters insists the start screen instructions are stale: she says
   "click on a gray spot to build a Tower" makes no sense because in her mind the
   building feature was removed ages ago, and she wants the hint text updated. I
   don't remember removing anything, but can you look into it while you're in there?

That's everything I have. I don't know which of these share a cause and which are
separate bugs — please dig in and restore the game to how it's supposed to play.


## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
