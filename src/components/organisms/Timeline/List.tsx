import React, { useState } from "react";
import { Box, useInput } from "ink";
import { parseTweet, ParsedTweet } from "twitter-text";
import type { TweetV1 } from "twitter-api-v2";

import type { TimelineProcess } from "../../../types";
import { useError, useRequestResult, useHint } from "../../../hooks";
import { useApi } from "../../../hooks/api";
import {
	useListPaginator,
	useListTimeline,
	useMover,
	useDisplayTweetsCount,
	getDisplayTimeline,
	getFocusedTweet,
} from "../../../hooks/v2";
import Detail from "../../organisms/Detail";
import TweetItem from "../../molecules/TweetItem";
import NewTweetBox from "../../molecules/NewTweetBox";

type Props = {
	onToggleList: () => void;
};

export const Timeline = ({ onToggleList }: Props) => {
	const [, setError] = useError();
	const [, setRequestResult] = useRequestResult();
	const [, setHintKey] = useHint();

	const api = useApi();
	const paginator = useListPaginator();
	const mover = useMover();
	const [, setTimeline] = useListTimeline();
	const [, countSetter] = useDisplayTweetsCount();
	const displayTimeline = getDisplayTimeline();
	const focusedTweet = getFocusedTweet();

	const [status, setStatus] = useState<"timeline" | "detail">("timeline");
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

	const update = async ({ future }: { future: boolean }) => {
		setInProcess("update");
		if (future) {
			setLoadingTimeline(displayTimeline);
		}
		const err = future
			? await paginator.fetchFuture()
			: await paginator.fetchPast();
		if (future) {
			setLoadingTimeline([]);
		}
		if (typeof err === "string") {
			setError(err);
		}
		setInProcess("none");
	};

	const newTweet = async () => {
		if (!valid) return;
		setInProcess("tweet");
		const err = await api.tweet(tweetText);
		if (typeof err === "string") {
			setError(err);
		} else {
			setIsNewTweetOpen(false);
			setRequestResult(`Successfully tweeted: "${tweetText}"`);
			setTweetText("");
			setHintKey("timeline");
		}
		setWaitReturn(false);
		setInProcess("none");
	};

	const fav = async () => {
		setInProcess("fav");

		const { favorited, id_str } = focusedTweet;
		const res = favorited
			? await api.unfavorite(id_str)
			: await api.favorite(id_str);

		if (typeof res === "string") {
			setError(res);
		} else {
			updateTweetInTimeline(res);
			setRequestResult(
				`Successfully ${res.favorited ? "favorited" : "unfavorited"}: @${
					res.user.screen_name
				} "${res.full_text.split("\n").join(" ")}"`
			);
		}
		setInProcess("none");
	};

	const rt = async () => {
		setInProcess("rt");

		const { retweeted, id_str } = focusedTweet;
		const res = retweeted
			? await api.unretweet(id_str)
			: await api.retweet(id_str);

		if (typeof res === "string") {
			setError(res);
		} else {
			updateTweetInTimeline(res);
			setRequestResult(
				`Successfully ${res.retweeted ? "retweeted" : "unretweeted"}: @${
					res.user.screen_name
				} "${res.full_text.split("\n").join(" ")}"`
			);
		}
		setInProcess("none");
	};

	const updateTweetInTimeline = (newTweet: TweetV1) =>
		setTimeline((prev) =>
			prev.map((t) => (t.id_str === newTweet.id_str ? newTweet : t))
		);

	useInput(
		(input, key) => {
			if (inProcess !== "none") return;

			if (key.upArrow || (key.shift && key.tab)) {
				mover.prev(() => update({ future: true }));
			} else if (key.downArrow || key.tab) {
				mover.next(() => update({ future: false }));
			} else if (key.pageUp) {
				mover.pageUp(() => update({ future: true }));
			} else if (key.pageDown) {
				mover.pageDown(() => update({ future: false }));
			} else if (input === "0") {
				mover.top();
			} else if (input === "9") {
				mover.bottom();
			} else if (input === "+" || input === "=") {
				countSetter.inc();
			} else if (input === "-" || input === "_") {
				countSetter.dec();
			} else if (input === "l") {
				onToggleList();
			} else if (input === "r") {
				// setIsTweetInDetailOpen(true);
				// setStatus("detail");
			} else if (input === "t") {
				rt();
			} else if (input === "f") {
				fav();
			} else if (input === "n") {
				setRequestResult(undefined);
				setIsNewTweetOpen(true);
				setHintKey("timeline/new/input");
			} else if (key.return) {
				setStatus("detail");
				setHintKey("timeline/detail");
			}
		},
		{ isActive: status === "timeline" && !isNewTweetOpen }
	);

	useInput(
		(_, key) => {
			if (inProcess !== "none") return;

			if (key.escape) {
				if (waitReturn) {
					setWaitReturn(false);
					setHintKey("timeline/new/input");
					return;
				}
				// Avoid warning: state update on an unmounted TextInput
				// Maybe caused by Node.js (single-threaded)?
				setTimeout(() => {
					setTweetText("");
					setIsNewTweetOpen(false);
					setHintKey("timeline");
				});
			} else if (waitReturn && key.return) {
				newTweet();
			}
		},
		{ isActive: status === "timeline" && isNewTweetOpen }
	);

	useInput(
		(input, key) => {
			if (key.escape) {
				setStatus("timeline");
				setHintKey("timeline");
			} else if (input === "t") {
				rt();
			} else if (input === "f") {
				fav();
			}
		},
		{ isActive: status === "detail" && !isTweetInDetailOpen }
	);

	const handleNewTweetChange = (value: string) => {
		setTweetText(value);
		setParsedTweet(parseTweet(value));
	};

	const removeFocusedTweetFromTimeline = (
		{
			redraft,
		}: {
			redraft: boolean;
		} = { redraft: false }
	) => {
		if (redraft) {
			handleNewTweetChange(focusedTweet.full_text);
			setIsNewTweetOpen(true);
		}
		setTimeline((prev) =>
			prev.filter((tw) => tw.id_str !== focusedTweet.id_str)
		);
		setStatus("timeline");
		if (redraft) {
			setHintKey("timeline/new/input");
		} else {
			setHintKey("timeline");
		}
	};

	const handleMention = () => {
		handleNewTweetChange(`@${focusedTweet.user.screen_name} `);
		setRequestResult(undefined);
		setIsNewTweetOpen(true);
		setStatus("timeline");
		setHintKey("timeline");
	};

	const handleWaitReturn = () => {
		setWaitReturn(valid);
		if (valid) setHintKey("timeline/new/wait-return");
	};

	if (status === "detail") {
		return (
			<Detail
				tweet={focusedTweet}
				onMention={handleMention}
				onRemove={removeFocusedTweetFromTimeline}
				isTweetOpen={isTweetInDetailOpen}
				setIsTweetOpen={setIsTweetInDetailOpen}
				inProcess={inProcess}
				setInProcess={setInProcess}
			/>
		);
	}

	return (
		<>
			<Box flexGrow={1} flexDirection="column">
				<>
					{(() => {
						if (loadingTimeline.length) {
							return (
								<>
									{loadingTimeline.map((t, i) => (
										<TweetItem
											key={i}
											tweet={t}
											isFocused={t.id_str === focusedTweet.id_str}
											inFav={
												t.id_str === focusedTweet.id_str && inProcess === "fav"
											}
											inRT={
												t.id_str === focusedTweet.id_str && inProcess === "rt"
											}
										/>
									))}
								</>
							);
						}
						return (
							<>
								{displayTimeline.map((t, i) => (
									<TweetItem
										key={i}
										tweet={t}
										isFocused={t.id_str === focusedTweet.id_str}
										inFav={
											t.id_str === focusedTweet.id_str && inProcess === "fav"
										}
										inRT={
											t.id_str === focusedTweet.id_str && inProcess === "rt"
										}
									/>
								))}
							</>
						);
					})()}
				</>
			</Box>
			{isNewTweetOpen && (
				<NewTweetBox
					type="new"
					loading={inProcess === "tweet"}
					tweet={focusedTweet}
					invalid={!valid && weightedLength !== 0}
					length={weightedLength}
					placeholder="What's happening?"
					focus={!waitReturn}
					value={tweetText}
					onChange={handleNewTweetChange}
					onSubmit={handleWaitReturn}
				/>
			)}
		</>
	);
};
