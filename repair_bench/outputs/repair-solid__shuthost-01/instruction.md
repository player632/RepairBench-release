# Our ShutHost panel is misbehaving

We self-host ShutHost to park a handful of machines in standby and wake them on demand from a web
panel. Lately several things in that panel are wrong. I am not a developer, so all I can give you is
what we see from the chair in front of the browser - please dig in, work out the causes and fix them.

**Read this before you start.** These reports only cover the corners of the panel our small team
actually touches. Not every defect is described in these reports: some faults we never noticed, and
some we would not even know how to put into words. So please read the whole front end through and
judge it against how it is supposed to behave, rather than only chasing the seven items below. Two of
the nine items are things we suspect are perfectly normal - we list them because they look strange to
us, not because we are sure they are broken.

## What we actually ran into

1. On the savings calculator the headline numbers are more optimistic than anything I type in can justify. There is a box for the power a machine still draws while it is parked in standby; changing it does nothing at all to the daily, monthly or yearly figures, as if that box were not connected to anything. What confuses me most is that the little formula write-up underneath still prints the subtraction with both numbers in it, so the page looks like it is doing the right maths.

2. When I press Start on a machine, its row never shows the panel as holding it. Half a minute later the same row still offers to start that machine again, and nothing anywhere in the row says the wake request belongs to us. Pressing Start twice does not help.

3. Every machine that is powered off is listed with the status 'unknown' instead of 'offline'. The ones that are on, the ones waking up and the ones shutting down all still look right - it is only the powered-off ones that lost their label.

4. In a machine's notification settings there is a number box next to a unit dropdown. When I switch the unit from minutes to hours the dropdown does change, but the number stays at 30 instead of moving to the three-hour default, so I end up notifying 30 hours ahead without noticing.

5. The logout button has disappeared from the top bar, on every single page, even though this coordinator is set up to sign in with a token. It used to be there; now the only way out is to close the tab.

6. When a sign-in fails in a way the coordinator does not recognise, the login page shows me an error about single sign-on. We have no single sign-on configured here at all, so that wording cannot be right - it reads like somebody else's setup is leaking into our error text.

7. On the archive machine, the hook that runs before startup now shows an extra line claiming a delay of zero seconds. It never used to print a delay line for that hook. The other hook on the same page still shows its own delay correctly, so it is not that all hooks changed.

## Two more things we cannot tell are faults at all

8. There is a yellow strip across the top of every page saying the panel is running in demo mode with simulated interactions only. It looks like leftover debug output that somebody forgot to take out - should we remove it?

9. The About page shows 'Failed to load dependencies: HTTP 404: Not Found' where the list of third-party components should be, and the licence block underneath looks odd too. Is that page broken?

## How we run it

- The panel is served as a plain static site with no coordinator process behind it, and it drives
  itself from its own built-in simulated fleet of three machines. We tested with the network
  unplugged and nothing changed, so please keep it that way: no calls out to external hosts and no
  new packages.
- We use a desktop browser window at 1440x900.
- The fleet takes a moment to fill in after a page opens, and one machine visibly walks through a
  couple of intermediate states when it is woken or released. That pacing is normal for us; what is
  not normal is a state we never get to see at all.
- Everything above is a user's-eye account. We do not read the code, we cannot tell you which file or
  which function is at fault, and we may well have described one underlying cause as two symptoms or
  two causes as one.

## Constraints

- Keep each change minimal and scoped to the behaviour that is actually broken.
- Do not change behaviour that is not defective. Two of the nine reports above describe intended
  behaviour, and "fixing" either of them makes things worse, not better.
- Do not remove, rename or repurpose any `data-testid` attributes - they are verification probes required by the checker.
- The front end must still build with its own build command, and the result must still be servable as
  a static site from the same directory it is served from today.
- Do not run the project's build, dev server or tests yourself to verify your work during the
  session; a separate verifier rebuilds the front end and drives it in a headless browser. Focus on
  reading the code and fixing root causes.

## How your work is verified

The verifier rebuilds the front end, serves it locally, and drives the panel through a fixed script of
interactions in a headless browser. Your score reflects how many of the genuinely defective behaviours
you actually fix, multiplied by how much of the already-working behaviour you left intact - so a fix
that repairs one report while breaking a neighbouring page scores worse than no fix at all.
