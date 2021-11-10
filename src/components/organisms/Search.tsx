import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import useDimensions from "ink-use-stdout-dimensions";
import { useError, useHint } from "../../hooks";
import {
	useTimeline,
	useMover,
	useSearchPaginator,
	useDisplayTweetsCount,
	getDisplayTimeline,
	getFocusedTweet,
	usePosition,
} from "../../hooks/search";
import { AbstractTimeline } from "./AbstractTimeline";

interface Props {
	query: string;
}

export const SearchPage = ({ query }: Props) => {
	const [, rows] = useDimensions();
	const [, setError] = useError();
	const [, setHintKey] = useHint();

	const displayTimeline = getDisplayTimeline();
	const [{ length: total }, setTimeline] = useTimeline();
	const paginator = useSearchPaginator();
	const mover = useMover();
	const [count, countActions] = useDisplayTweetsCount();
	const focusedTweet = getFocusedTweet();
	const [{ cursor }] = usePosition();

	const [status, setStatus] = useState<"init" | "timeline">("init");

	useEffect(() => {
		initialFetch();

		return () => setStatus("init");
	}, []);

	const initialFetch = async () => {
		const error = await paginator.fetch({ q: `"${query}" -RT` });
		if (typeof error === "string") {
			setError(error);
		}
		setStatus("timeline");
		setHintKey("unique/timeline");
	};

	const Header = () => (
		<Box justifyContent="space-between" marginBottom={1}>
			<Text color="#00acee" bold>
				Search: {query}
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
