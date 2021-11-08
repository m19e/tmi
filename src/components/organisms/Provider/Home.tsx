import React, { useState, useEffect } from "react";
import { Text } from "ink";
import { useCurrentColumn, useError, useHint } from "../../../hooks";
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
	const [column] = useCurrentColumn();
	const [, setError] = useError();
	const [, setHintKey] = useHint();

	const displayTimeline = getDisplayTimeline();
	const [, setTimeline] = useHomeTimeline();
	const paginator = useHomePaginator();
	const mover = useMover();
	const [, countActions] = useDisplayTweetsCount();
	const focusedTweet = getFocusedTweet();

	const [status, setStatus] = useState<"init" | "timeline">("init");

	useEffect(() => {
		if (column.type === "home") {
			if (focusedTweet) {
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
	}, [column.type]);

	if (status === "init") {
		return <Text>Loading...</Text>;
	}
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
