import dayjs from "dayjs";
import { useEffect, useState, type FC } from "react";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

interface Props {
	start: Date | string | null | undefined;
}

export const CountUp: FC<Props> = ({ start }) => {
	// Handle null/undefined/empty string dates
	if (start == null || start === "") {
		return <>-</>;
	}
	const dayjsDate = dayjs(start);
	if (!dayjsDate.isValid()) {
		return <>-</>;
	}
	const [val, setVal] = useState(dayjsDate.fromNow(true));
	useEffect(() => {
		const interval = setInterval(() => {
			setVal(dayjsDate.fromNow(true));
		}, 1000);
		return () => clearInterval(interval);
	}, [dayjsDate]);
	return <>{val}</>;
};
