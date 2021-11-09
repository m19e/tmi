import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import { useError, useHint } from "../../hooks";
import {
	useHomeTimeline,
	useMover,
	useHomePaginator,
	useDisplayTweetsCount,
	getDisplayTimeline,
	getFocusedTweet,
	usePosition,
} from "../../hooks/home";
import { AbstractTimeline } from "./AbstractTimeline";

export const HomePage = () => {
	const [, rows] = useDimensions();
	const [, setError] = useError();
	const [, setHintKey] = useHint();

	const displayTimeline = getDisplayTimeline();
	const [{ length: total }, setTimeline] = useHomeTimeline();
	const paginator = useHomePaginator();
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
				Home
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
				type="home"
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
