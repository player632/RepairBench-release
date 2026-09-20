import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { MeiliSearch } from "meilisearch";
import { useMemo } from "react";
import { useCurrentInstance } from "./useCurrentInstance";

export const useIndexTaskCounts = (
	client: MeiliSearch,
	indexUids: string[],
) => {
	const currentInstance = useCurrentInstance();
	const host = currentInstance?.host;

	// Only query if we have index UIDs
	const enabled = indexUids.length > 0;

	const query = useQuery({
		queryKey: ["indexTaskCounts", host, indexUids.sort().join(",")],
		queryFn: async () => {
			// Query tasks for all indexes with enqueued or processing status
			const tasksResult = await client.getTasks({
				indexUids,
				statuses: ["enqueued", "processing", "failed"],
				limit: 1000, // Get up to 1000 tasks to count
			});

			// Count tasks per index
			const counts = new Map<string, number>();
			for (const task of tasksResult.results) {
				if (task.indexUid) {
					const currentCount = counts.get(task.indexUid) || 0;
					counts.set(task.indexUid, currentCount + 1);
				}
			}

			return counts;
		},
		enabled,
		refetchInterval: 5000, // Refetch every 5 seconds to keep counts updated
	});

	// Convert Map to object for easier use in components
	const taskCounts = useMemo(() => {
		if (!query.data) {
			return {} as Record<string, number>;
		}
		const result: Record<string, number> = {};
		for (const [indexUid, count] of query.data.entries()) {
			result[indexUid] = count;
		}
		return result;
	}, [query.data]);

	return [taskCounts, query] as [
		Record<string, number>,
		UseQueryResult<Map<string, number>>,
	];
};
