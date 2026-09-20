"use client";
import { cn } from "@/lib/cn";
import { getTimeAgo, getTimeText } from "@/utils/text";
import dayjs from "dayjs";
import { type FC, useState } from "react";
interface Props {
	className?: string;
	date?: Date | string | null;
}

export const TimeAgo: FC<Props> = ({ className = "", date }) => {
	const [isHover, setIsHover] = useState(false);
	// Check for null/undefined/empty string and validate date before using it
	if (date == null || date === "") {
		return <div data-testid="rb-timeago-empty" className={cn("w-fit h-fit", className)}>-</div>;
	}
	const dayjsDate = dayjs(date);
	if (!dayjsDate.isValid()) {
		return <div data-testid="rb-timeago-invalid" className={cn("w-fit h-fit", className)}>-</div>;
	}
	return (
		<div
			data-testid="rb-timeago-value"
			className={cn("w-fit h-fit", className)}
			onMouseEnter={() => {
				setIsHover(true);
			}}
			onMouseLeave={() => {
				setIsHover(false);
			}}
		>
			{isHover ? getTimeText(date) : getTimeAgo(date)}
		</div>
	);
};
