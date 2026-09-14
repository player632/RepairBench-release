import { redis } from './redis';

// Fixed-window counter: INCR the key, and on the first hit of the window (count === 1)
// give it a TTL so it auto-resets after windowSec. Returns true while within the limit.
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
	const count = await redis.incr(key);
	if (count === 1) {
		await redis.expire(key, windowSec);
	}
	return count <= limit;
}
