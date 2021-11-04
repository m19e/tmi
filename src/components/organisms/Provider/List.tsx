import React from "react";
import {
	useTimelineWithCache,
	useMover,
	useListPaginator,
	useDisplayTweetsCount,
	getDisplayTimeline,
	getFocusedTweet,
} from "../../../hooks/list";
import { AbstractTimeline } from "../AbstractTimeline";

export const ListProvider = () => {
	const displayTimeline = getDisplayTimeline();
	const [, setTimeline] = useTimelineWithCache();
	const paginator = useListPaginator();
	const mover = useMover();
	const [, countActions] = useDisplayTweetsCount();
	const focusedTweet = getFocusedTweet();

	return (
		<AbstractTimeline
			type="list"
			timeline={displayTimeline}
			setTimeline={setTimeline}
			paginator={paginator}
			mover={mover}
			countActions={countActions}
			focusedTweet={focusedTweet}
		/>
	);
};
