import { z } from 'zod';
import {
	EXTRACT_MAX,
	NICK_ALLOWED_REGEX,
	NICK_HAS_ALNUM_REGEX,
	NICK_MAX,
	NICK_MIN,
	TIME_MAX
} from '$lib/leaderboard/schema';

export const submitSchema = z.object({
	nickname: z
		.string()
		.trim()
		.min(NICK_MIN)
		.max(NICK_MAX)
		.regex(NICK_ALLOWED_REGEX)
		.regex(NICK_HAS_ALNUM_REGEX),
	extract: z.number().int().min(0).max(EXTRACT_MAX),
	time: z.number().int().min(0).max(TIME_MAX)
});
