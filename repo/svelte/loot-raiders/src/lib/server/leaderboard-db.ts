import { redis } from './redis';
import { LEADERBOARD_TOP_N, type LeaderboardEntry } from '$lib/leaderboard/schema';

const LEADERBOARD_KEY = 'leaderboard:global';
const playerKey = (playerId: string) => `player:${playerId}`;

interface PlayerHash {
	nickname: string;
	time: number;
	createdAt: number;
}

export async function getTopEntries(): Promise<LeaderboardEntry[]> {
	const raw = await redis.zrange(LEADERBOARD_KEY, 0, LEADERBOARD_TOP_N - 1, {
		rev: true,
		withScores: true
	});

	const playerIds: string[] = [];
	const scores: number[] = [];
	for (let i = 0; i < raw.length; i += 2) {
		playerIds.push(String(raw[i]));
		scores.push(Number(raw[i + 1]));
	}
	if (playerIds.length === 0) return [];

	const pipeline = redis.pipeline();
	for (const id of playerIds) {
		pipeline.hgetall(playerKey(id));
	}
	const hashes = (await pipeline.exec()) as (PlayerHash | null)[];

	const entries: LeaderboardEntry[] = [];
	for (let i = 0; i < playerIds.length; i++) {
		const hash = hashes[i];
		if (!hash) continue;
		entries.push({
			playerId: playerIds[i],
			nickname: hash.nickname,
			extract: scores[i],
			time: Number(hash.time),
			createdAt: Number(hash.createdAt)
		});
	}
	return entries;
}

export async function getPlayerRank(playerId: string): Promise<number | null> {
	const rank = await redis.zrevrank(LEADERBOARD_KEY, playerId);
	return rank === null ? null : rank + 1;
}

export async function submitScore(
	playerId: string,
	nickname: string,
	extract: number,
	time: number
): Promise<{ improved: boolean }> {
	await redis.hset(playerKey(playerId), { nickname });

	const changed = await redis.zadd(
		LEADERBOARD_KEY,
		{ gt: true, ch: true },
		{ score: extract, member: playerId }
	);
	const improved = changed === 1;

	if (improved) {
		await redis.hset(playerKey(playerId), { time, createdAt: Date.now() });
	}

	return { improved };
}
