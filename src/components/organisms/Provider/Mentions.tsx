import React from "react";
import {
	useTimeline,
	useDisplayTweetsCount,
	useMover,
	useMentionsPaginator,
	getDisplayTimeline,
	getFocusedTweet,
} from "../../../hooks/mentions";
import { AbstractTimeline } from "../AbstractTimeline";

export const MentionsProvider = () => {
	const displayTimeline = getDisplayTimeline();
	const [, setTimeline] = useTimeline();
	const paginator = useMentionsPaginator();
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
