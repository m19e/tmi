import React from "react";
import {
	useHomeTimeline,
	useMover,
	useHomePaginator,
	useDisplayTweetsCount,
	getDisplayTimeline,
	getFocusedTweet,
} from "../../../hooks/home";
import { AbstractTimeline } from "../AbstractTimeline";

export const HomeProvider = () => {
	const displayTimeline = getDisplayTimeline();
	const [, setTimeline] = useHomeTimeline();
	const paginator = useHomePaginator();
	const mover = useMover();
	const [, countActions] = useDisplayTweetsCount();
	const focusedTweet = getFocusedTweet();

	return (
		<AbstractTimeline
			type="home"
			timeline={displayTimeline}
			setTimeline={setTimeline}
			paginator={paginator}
			mover={mover}
			countActions={countActions}
			focusedTweet={focusedTweet}
		/>
	);
};
