# PokéDex web app - a few things started acting up

Hi! I look after this offline Pokédex web app. After some recent changes a bunch of things feel off. Could you have a look?

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

1. When I open a Pokémon from the list, the page shows a different Pokémon than the one I tapped. For example, opening the very first entry shows its evolved form instead - it feels like the list and the detail pages are out of sync with each other.
2. Filtering the list feels wrong too: the tiles don't seem to follow the creatures. It is as if the same tiles get reused to display whatever the filter result is, instead of the matching entries moving into place. I put a temporary marker on one tile to check, and the marker stayed put while the creature shown there changed.
3. Typing in the search field never really narrows the list down - I keep waiting and nothing happens for ages.
4. In the stats panel, switching to the Max view shows the lowest numbers instead of the highest, and the Min view seems to be the other way around.
5. The small list images are broken all over the place - every entry shows a broken picture.
6. In the settings menu there is an option for the mega-evolution animation. When I turn it off it doesn't stick - next time I check, it is back on again.
7. After I look at a Pokémon and go back to the list, the top bar stays tinted like it is still on that creature's page, and the search field has disappeared.
8. At startup the app sometimes warns me that images need an internet connection and that new images won't load. Honestly the pictures look fine to me even without a connection - is that warning something to worry about?
9. A friend told me there should be an install option somewhere in the welcome/about menu, but I can't find one on my machine. Is that broken?

I mostly notice this in a regular desktop browser. Tell me if you need more details.


## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
