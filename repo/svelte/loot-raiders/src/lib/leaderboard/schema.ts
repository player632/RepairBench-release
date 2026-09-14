export const NICK_MIN = 2;
export const NICK_MAX = 12;

export const EXTRACT_MAX = 1_000_000;
export const TIME_MAX = 600;

export const LEADERBOARD_TOP_N = 100;

export interface LeaderboardEntry {
	playerId: string;
	nickname: string;
	extract: number;
	time: number;
	createdAt: number;
}

export interface LeaderboardResponse {
	entries: LeaderboardEntry[];
	myPlayerId: string | null;
	myRank: number | null;
}

export interface SubmitResponse {
	improved: boolean;
	rank: number | null;
}

// Allowed nickname characters — shared by client validation and the server Zod schema.
export const NICK_ALLOWED_REGEX = /^[A-Za-z0-9-]+$/;

// Nickname must contain at least one letter or digit (blocks all-dash names like "--").
export const NICK_HAS_ALNUM_REGEX = /[A-Za-z0-9]/;
