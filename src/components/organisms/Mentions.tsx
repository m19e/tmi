import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import { useError, useHint } from "../../hooks";
import {
	useTimeline,
	useMover,
	useMentionsPaginator,
	useDisplayTweetsCount,
	getDisplayTimeline,
	getFocusedTweet,
	usePosition,
} from "../../hooks/mentions";
import { AbstractTimeline } from "./AbstractTimeline";

export const MentionsPage = () => {
	const [, rows] = useDimensions();
	const [, setError] = useError();
	const [, setHintKey] = useHint();

	const displayTimeline = getDisplayTimeline();
	const [{ length: total }, setTimeline] = useTimeline();
	const paginator = useMentionsPaginator();
	const mover = useMover();
	const [count, countActions] = useDisplayTweetsCount();
	const focusedTweet = getFocusedTweet();
	const [{ cursor }] = usePosition();

	const [status, setStatus] = useState<"init" | "timeline">("init");

	useEffect(() => {
		const f = async () => {
			const error = await paginator.fetch();
			if (typeof error === "string") {
				setError(error);
			}
			setStatus("timeline");
			setHintKey("unique/timeline");
		};
		f();

		return () => setStatus("init");
	}, []);

	const Header = () => (
		<Box justifyContent="space-between" marginBottom={1}>
			<Text color="#00acee" bold>
				Mentions
			</Text>
			<Text>
				[{cursor + 1}-{cursor + count}/{total}]
			</Text>
		</Box>
	);

	if (status === "init") {
		return <Text>Loading...</Text>;
	}
	return (
		<Box flexDirection="column" minHeight={rows}>
			<Header />
			<AbstractTimeline
				type="mentions"
				timeline={displayTimeline}
				setTimeline={setTimeline}
				paginator={paginator}
				mover={mover}
				countActions={countActions}
				focusedTweet={focusedTweet}
			/>
		</Box>
	);
};
