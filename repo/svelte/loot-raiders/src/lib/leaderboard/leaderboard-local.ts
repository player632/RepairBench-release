// Offline adaptation: replaces the SvelteKit remote functions (Upstash Redis backend) with a
// deterministic local board so the game runs with zero network. The exported API keeps the
// shape the components consume (`query.current`, `query.refresh()`, async submitScore).
import { browser } from '$app/environment';
import { LEADERBOARD_TOP_N } from './schema';
import type { LeaderboardEntry, LeaderboardResponse, SubmitResponse } from './schema';

const STORE_KEY = 'lr:local-board:v1';
const LOCAL_PLAYER_ID = 'local-player';

interface StoredRow {
	playerId: string;
	nickname: string;
	extract: number;
	time: number;
	createdAt: number;
}

const SEED_ROWS: StoredRow[] = [
	{ playerId: 'bot-wraithe', nickname: 'Wraithe', extract: 96200, time: 208, createdAt: 1750000007000 },
	{ playerId: 'bot-kestrel', nickname: 'Kestrel', extract: 81400, time: 195, createdAt: 1750000006000 },
	{ playerId: 'bot-marrow', nickname: 'Marrow', extract: 66900, time: 187, createdAt: 1750000005000 },
	{ playerId: 'bot-sable', nickname: 'Sable', extract: 55250, time: 176, createdAt: 1750000004000 },
	{ playerId: 'bot-vex', nickname: 'Vex', extract: 43800, time: 169, createdAt: 1750000003000 },
	{ playerId: 'bot-rook', nickname: 'Rook', extract: 30150, time: 158, createdAt: 1750000002000 },
	{ playerId: 'bot-nyx', nickname: 'Nyx', extract: 18700, time: 140, createdAt: 1750000001000 },
	{ playerId: 'bot-ash', nickname: 'Ash', extract: 7300, time: 122, createdAt: 1750000000000 }
];

function loadLocalRows(): StoredRow[] {
	try {
		const raw = window.localStorage.getItem(STORE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function saveLocalRows(rows: StoredRow[]): void {
	try {
		window.localStorage.setItem(STORE_KEY, JSON.stringify(rows));
	} catch {
		// storage unavailable — the in-memory board still works for the session
	}
}

function boardEntries(): LeaderboardEntry[] {
	const merged = [...SEED_ROWS, ...loadLocalRows()];
	merged.sort((a, b) => b.extract - a.extract || a.createdAt - b.createdAt);
	return merged.slice(0, LEADERBOARD_TOP_N);
}

function rankOf(entries: LeaderboardEntry[], playerId: string): number | null {
	const index = entries.findIndex((e) => e.playerId === playerId);
	return index === -1 ? null : index + 1;
}

function readBoard(): LeaderboardResponse {
	const entries = boardEntries();
	return {
		entries,
		myPlayerId: LOCAL_PLAYER_ID,
		myRank: rankOf(entries, LOCAL_PLAYER_ID)
	};
}

interface LocalQuery<T> {
	current: T | undefined;
	refresh: () => void;
}

export function getLeaderboard(): LocalQuery<LeaderboardResponse> {
	const query: LocalQuery<LeaderboardResponse> = {
		current: undefined,
		refresh() {
			if (browser) this.current = readBoard();
		}
	};
	if (browser) query.current = readBoard();
	return query;
}

export function getMyRank(): LocalQuery<number | null> {
	const query: LocalQuery<number | null> = {
		current: undefined,
		refresh() {
			if (browser) this.current = readBoard().myRank;
		}
	};
	if (browser) query.current = readBoard().myRank;
	return query;
}

export async function submitScore(input: {
	nickname: string;
	extract: number;
	time: number;
}): Promise<SubmitResponse> {
	if (!browser) return { improved: false, rank: null };

	const rows = loadLocalRows();
	const existing = rows.find((r) => r.playerId === LOCAL_PLAYER_ID);
	const improved = !existing || input.extract > existing.extract;

	if (improved) {
		const row: StoredRow = {
			playerId: LOCAL_PLAYER_ID,
			nickname: input.nickname,
			extract: input.extract,
			time: input.time,
			createdAt: Date.now()
		};
		const next = rows.filter((r) => r.playerId !== LOCAL_PLAYER_ID);
		next.push(row);
		saveLocalRows(next);
	}

	return { improved, rank: rankOf(boardEntries(), LOCAL_PLAYER_ID) };
}
