import React, { useState, useEffect } from "react";
import { Text } from "ink";
import { useCurrentColumn, useError, useHint } from "../../../hooks";
import {
	useTimelineWithCache,
	useMover,
	useListPaginator,
	useDisplayTweetsCount,
	getDisplayTimeline,
	getFocusedTweet,
	usePosition,
} from "../../../hooks/list";
import { AbstractTimeline } from "../AbstractTimeline";

export const ListProvider = () => {
	const [column] = useCurrentColumn();
	const [, setError] = useError();
	const [, setHintKey] = useHint();

	const displayTimeline = getDisplayTimeline();
	const [, setTimeline] = useTimelineWithCache();
	const paginator = useListPaginator();
	const mover = useMover();
	const [, countActions] = useDisplayTweetsCount();
	const focusedTweet = getFocusedTweet();
	const [, { loadPosition }] = usePosition();

	const [status, setStatus] = useState<"init" | "timeline">("init");

	useEffect(() => {
		if (column.type === "list") {
			if (column.timeline.length) {
				setTimeline(column.timeline);
				loadPosition();
				setStatus("timeline");
				setHintKey("timeline");
			} else {
				const f = async () => {
					const error = await paginator.fetch();
					if (typeof error === "string") {
						setError(error);
					}
					setStatus("timeline");
					setHintKey("timeline");
				};
				f();
			}
		}

		return () => setStatus("init");
	}, [column.name]);

	if (status === "init") {
		return <Text>Loading...</Text>;
	}
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
