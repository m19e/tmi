import React, { useState, useEffect } from "react";
import { Text } from "ink";
import { useCurrentColumn, useError, useHint } from "../../../hooks";
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
	const [column] = useCurrentColumn();
	const [, setError] = useError();
	const [, setHintKey] = useHint();

	const displayTimeline = getDisplayTimeline();
	const [, setTimeline] = useTimeline();
	const paginator = useMentionsPaginator();
	const mover = useMover();
	const [, countActions] = useDisplayTweetsCount();
	const focusedTweet = getFocusedTweet();

	const [status, setStatus] = useState<"init" | "timeline">("init");

	useEffect(() => {
		if (column.type === "mentions") {
			if (focusedTweet) {
				setStatus("timeline");
				setHintKey("timeline");
			} else {
				const f = async () => {
					setHintKey("none");
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
	}, [column.type]);

	if (status === "init") {
		return <Text>Loading...</Text>;
	}
	return (
		<AbstractTimeline
			type="column"
			timeline={displayTimeline}
			setTimeline={setTimeline}
			paginator={paginator}
			mover={mover}
			countActions={countActions}
			focusedTweet={focusedTweet}
		/>
	);
};
