import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { parseTweet, ParsedTweet } from "twitter-text";
import type { TimelineProcess } from "../../../types";
import {
	useCurrentColumn,
	useError,
	useRequestResult,
	useHint,
} from "../../../hooks";
import { useTwitterApi } from "../../../hooks/v2";
import {
	useHomeTimeline,
	usePosition,
	useMover,
	useDisplayTweetsCount,
	getDisplayTimeline,
	getFocusedTweet,
} from "../../../hooks/home";
import TweetItem from "../../molecules/TweetItem";

export const HomeTimeline = () => {
	const [, setError] = useError();
	const [, setRequestResult] = useRequestResult();
	const [, setHintKey] = useHint();

	const api = useTwitterApi();
	const mover = useMover();
	const [column] = useCurrentColumn();
	const [timeline, setTimeline] = useHomeTimeline();
	const [{ cursor, focus }] = usePosition();
	const [, countActions] = useDisplayTweetsCount();
	const displayTimeline = getDisplayTimeline();
	const focusedTweet = getFocusedTweet();

	const [status, setStatus] = useState<"init" | "timeline" | "detail">(
		"timeline"
	);
	const [inProcess, setInProcess] = useState<TimelineProcess>("none");
	const [isNewTweetOpen, setIsNewTweetOpen] = useState(false);
	const [waitReturn, setWaitReturn] = useState(false);
	const [tweetText, setTweetText] = useState("");
	const [{ weightedLength, valid }, setParsedTweet] = useState<ParsedTweet>(
		parseTweet("")
	);
	const [isTweetInDetailOpen, setIsTweetInDetailOpen] = useState(false);
	const [loadingTimeline, setLoadingTimeline] = useState<
		typeof displayTimeline
	>([]);

	useEffect(() => {
		if (column.type === "home") {
			if (!timeline.length) {
				const init = async () => {
					const res = await api.getHomeTweets({
						count: 200,
						include_entities: true,
					});
					if (typeof res === "string") {
						// setError(res)
					} else {
						setTimeline(res);
					}
					setStatus("timeline");
				};
				init();
			} else {
				setStatus("timeline");
			}
		}
	}, [column.type]);

	useInput((input, key) => {
		if (key.upArrow || (key.shift && key.tab)) {
			mover.prev(() => {});
		} else if (key.downArrow || key.tab) {
			mover.next(() => {});
		} else if (key.pageUp) {
			mover.pageUp(() => {});
		} else if (key.pageDown) {
			mover.pageDown(() => {});
		} else if (input === "0") {
			mover.top();
		} else if (input === "9") {
			mover.bottom();
		} else if (input === "+" || input === "=") {
			countActions.inc();
		} else if (input === "-" || input === "_") {
			countActions.dec();
		} else if (input === "t") {
			// rt();
		} else if (input === "f") {
			// fav();
		} else if (input === "n") {
			// setRequestResult(undefined);
			// setIsNewTweetOpen(true);
			// setHintKey("timeline/new/input");
		} else if (key.return) {
			// setStatus("detail");
			// setHintKey("timeline/detail");
		}
	}, {});

	if (status === "init") {
		return <Text>Loading...</Text>;
	}
	return (
		<Box flexDirection="column" flexGrow={1}>
			<Text>
				current cursor:{cursor} focus:{focus}
			</Text>
			{displayTimeline.map((t) => (
				<TweetItem
					key={t.id_str}
					tweet={t}
					isFocused={focusedTweet.id_str === t.id_str}
					inFav={false}
					inRT={false}
				/>
			))}
		</Box>
	);
};
