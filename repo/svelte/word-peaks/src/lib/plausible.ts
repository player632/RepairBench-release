import { dev } from '$app/environment'

type EventName =
	| 'gameWon'
	| 'firstFinish'
	| 'submitGuess'
	| 'resultShare'
	| 'gameLost'
	| 'idleOnFinish'
	| 'idleBeforeFinish'
	| 'dailyFinish'
	| 'promoLinkFollow'
	| 'danceClick'
	| 'landscapeShare'
	| 'statsImported'
	| 'herdModeActivate'

// [repair-bench adaptation] analytics disabled for the offline build: the
// Plausible tracker (apiHost plausible.pixelatomy.com) is replaced with local
// no-ops so no analytics request is ever issued at runtime.
const plausible = { trackPageview() {}, trackEvent(_name: string) {} }

export const trackPageview = () => track('pageview')
export const trackEvent = (eventName: EventName) => track(eventName)

function track(type: 'pageview' | EventName) {
	if (dev) {
		console.log('Tracked', type, 'event')
		return
	}
	try {
		if (type === 'pageview') plausible.trackPageview()
		else plausible.trackEvent(type)
	} catch (e) {
		console.warn(`Failed to track ${type}`, e)
	}
}
