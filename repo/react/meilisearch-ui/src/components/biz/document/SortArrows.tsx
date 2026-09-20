"use client";
import { Tooltip } from "@arco-design/web-react";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";
import type { Settings } from "meilisearch";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

type SortState = {
	field: string;
	direction: "asc" | "desc";
} | null;

type Props = {
	attr: string;
	indexSettings: Settings;
	sortState: SortState;
	currentSort: string;
	onSortChange: (sort: string) => void;
};

export const SortArrows = ({
	attr,
	indexSettings,
	sortState,
	currentSort,
	onSortChange,
}: Props) => {
	const { t } = useTranslation("index");
	const isSortable = indexSettings?.sortableAttributes?.includes(attr);
	const isActive = sortState?.field === attr;
	const isAsc = isActive && sortState?.direction === "asc";
	const isDesc = isActive && sortState?.direction === "desc";

	if (!isSortable) {
		return null;
	}

	const handleSortClick = (direction: "asc" | "desc") => {
		// If clicking the same direction that's already active, clear sort
		// Otherwise, set to the clicked direction (replace existing sort)
		if (isActive && sortState?.direction === direction) {
			// Clear sort when clicking the same direction again
			onSortChange("");
		} else {
			// Set to the clicked direction (replace existing sort)
			onSortChange(`${attr}:${direction}`);
		}
	};

	return (
		<Tooltip content={t("index:setting.sortableAttributes")}>
			<div className="flex items-center justify-center gap-0 ml-0.5">
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						handleSortClick("asc");
					}}
					className={cn(
						"p-0.5 border-0 bg-transparent cursor-pointer",
						"hover:bg-neutral-100 rounded-l transition-colors",
						"flex items-center justify-center",
					)}
					aria-label="Sort ascending"
				>
					<IconArrowUp
						size={14}
						strokeWidth={2.5}
						className={cn(
							"transition-all",
							isAsc
								? "opacity-100 text-primary-600"
								: "opacity-40 text-neutral-500",
						)}
					/>
				</button>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						handleSortClick("desc");
					}}
					className={cn(
						"p-0.5 border-0 bg-transparent cursor-pointer",
						"hover:bg-neutral-100 rounded-r transition-colors",
						"flex items-center justify-center",
					)}
					aria-label="Sort descending"
				>
					<IconArrowDown
						size={14}
						strokeWidth={2.5}
						className={cn(
							"transition-all",
							isDesc
								? "opacity-100 text-primary-600"
								: "opacity-40 text-neutral-500",
						)}
					/>
				</button>
			</div>
		</Tooltip>
	);
};
