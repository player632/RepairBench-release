# Repair Task - YTubic (a YouTube Music client, running here as a plain web app)

You are working on the source code of **YTubic**, a music client written in TypeScript with
React 19, TanStack Router and TanStack Query, styled with Tailwind v4 and bundled by Vite.
Upstream it is a desktop application: catalogue data reaches it through a native HTTP client
and every native side effect (accounts, cookies, cache folders, media keys, second windows,
deep links, updates) goes through a desktop bridge. In this copy all of that desktop plumbing
has been replaced by local stand-ins that answer from a small built-in catalogue, so the app
runs as an ordinary static web build, needs no account and no network, and shows the same
things every time you load it. Nothing you read below depends on the desktop parts.

What is on screen. The **home screen** is a stack of shelves - rows of cards, each row with a
title - built from what the service sends: recently played, mixes, recommendations, new
releases. Each card carries cover art, a title and a subtitle, and the shape of the art frame
follows the shape of the artwork. You can rearrange the shelves and switch individual ones off,
and both of those choices are remembered between visits. The **search screen** has a field at
the top with a dropdown of your past searches, and filter tabs underneath (All, Songs, Artists,
Albums, Videos, Playlists). On the All tab the page leads with a large headline card for the
single best match - with its own action button - followed by a dense list of songs and then a
shelf per entity type; each filter tab shows just that type. Track rows show a title, an
artist and a length written as minutes and seconds. There are also library, history and
settings screens, which are not part of any report below.

**Read this first.** What follows is nine things our few users noticed and wrote down, and
**not every defect is described in these reports** - 并非所有缺陷都有报告提及. Some faults we
never noticed at all, or could not describe without opening the code; and a couple of the
items below are things we suspect are wrong but that may well be the app behaving as it
should. So please go through the whole of the search and home surfaces yourself, root-cause
what you find, and do not treat the list as complete or as one change per item.

## What our users reported
1. "Searching has lost its headline. Whenever I look something up and stay on the All tab, the big card at the very top - the one that shows the single best match, larger than everything else, with its own button - is not there any more, whatever I type. The rest of the page still comes up: the songs are listed and the rows for artists, albums, videos and playlists are all there with their pictures, so the search is obviously still finding things. It is only that headline card that never shows."

2. "Typing in the search field does not move the page any more. I used to be able to keep typing and the page would catch up about a third of a second after I paused - the results would settle and the address at the top would pick up what I had typed. Now it just sits there. I counted to thirty out of stubbornness and it still had not caught up. Pressing Enter does still work, which is why I know the field itself is alive, and what I type is in the box the whole time. The other half of it: if I reload or copy the address while I am mid-typing, my search is gone, because the address never picked it up."

3. "My home screen has stopped respecting the order I put its sections in. A while ago I moved two sections to the front and it stuck - every visit since then started with those two. Now the home screen comes up in whatever order the service happens to send, and the two I moved are down among the others. Nothing is missing: the same five sections are there, and if I clear my arrangement it looks the same as it always did. It is only my saved order that gets thrown away."

4. "I turned off one of the sections on my home screen and it is still there. I only turned off one, and it is the one that will not go: reload, wait, come back later, still there. Curiously, when I turned off a second one afterwards to test it, that second one DID disappear. So switching sections off works in general - it is always the first one I switch off that refuses to be hidden."

5. "Some of the track lengths are wrong by a minute. The one I am sure about is a track that runs three minutes thirty-two seconds - I have played it enough to know - and the list beside it says 4:32. Plenty of other tracks in the same list are right, so it is not all of them. When it is wrong it is always the minute that is one too many and the seconds part is right."

6. "A second time thing, and it looks more like a typo than a mistake. When a track's seconds are a single digit, the zero has gone missing: three minutes and five seconds comes out as '3:5' rather than '3:05'. Tracks whose seconds are ten or above are written properly, so it is only the single-digit ones that look broken."

7. "The tiles on my home screen are the wrong shape. Album and song tiles have always been neat squares; now every one of them is a wide letterbox panel, the shape you would use for a film. The pictures themselves are the right pictures and nothing is missing - it is only the frame each one sits in, and it happened to everything at once rather than to one row."

8. "One item on my home screen - a live recording - sits in a wide panel, the shape you would use for a film, and its picture looks pulled to fit. I expected everything on that screen to be a neat square like the rest of my albums. Is that one supposed to be different, or is it another face of the shape problem I described above?"

9. "My home screen lists the same section twice: two rows with exactly the same name, one straight after the other, and the two of them hold different things. It looks like a duplicate that should have been merged into one row."
## Constraints

- Do not run the project's build, dev server or tests to verify yourself during the session; a
  separate verifier rebuilds the app and drives it in a real browser. Focus on reading the code
  and fixing root causes.
- There is nothing to run and no test suite to consult: this copy has no unit tests in it, and
  the catalogue it answers from is fixed, so a symptom you can reproduce by reading is worth
  more than one you can only guess at.
- Fix the underlying cause of each defect. Do not special-case the built-in catalogue, the
  observed strings, or the verification probes: the checker drives the real application through
  a real browser and reads what the application itself renders and stores.
- Leave the `data-testid` attributes in place. They are how the checker finds things; they carry
  no behaviour and removing or renaming them will fail the task even if the app is fixed.
- Leave the rest of the application behaving as it does now. In particular the two shelves that
  share a title, the one genuinely wide tile on the home screen, the way a filter tab shows its
  own entity type in full, the way the suggestion dropdown lists your whole past-search list when
  the field is empty, and the way the artwork layers a sharper variant over a base one are all
  intended behaviour and are checked.
