import type { Handle } from '@sveltejs/kit';

const COOKIE_NAME = 'lr_pid';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const handle: Handle = async ({ event, resolve }) => {
	let playerId = event.cookies.get(COOKIE_NAME);
	if (!playerId) {
		playerId = crypto.randomUUID();
		event.cookies.set(COOKIE_NAME, playerId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !import.meta.env.DEV,
			maxAge: ONE_YEAR_SECONDS
		});
	}
	event.locals.playerId = playerId;
	return resolve(event);
};
