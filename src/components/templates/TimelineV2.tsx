import React, { useState } from "react";
import { Box, useInput } from "ink";
import { parseTweet, ParsedTweet } from "twitter-text";

import type { TimelineProcess } from "../../types";
import type { Tweet } from "../../types/twitter";
import { convertTweetToDisplayable } from "../../lib";
import {
	useApi,
	useError,
	useRequestResult,
	useHint,
	useTimeline,
	useMover,
	useCursorIndex,
	useDisplayTweetsCount,
	getDisplayTimeline,
	getFocusedTweet,
} from "../../hooks";
import { useTwitterApi, useListPaginator } from "../../hooks/v2";
import Detail from "../organisms/Detail";
import TweetItem from "../molecules/TweetItem";
import NewTweetBox from "../molecules/NewTweetBox";

type Props = {
	onToggleList: () => void;
};

export const Timeline = ({ onToggleList }: Props) => {
	const api = useTwitterApi();
	const paginator = useListPaginator();
	const mover = useMover();
	const [, setError] = useError();
	const [, setRequestResult] = useRequestResult();
	const [, setHintKey] = useHint();
	const [, setTimeline] = useTimeline();
	const [, setCursor] = useCursorIndex();
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

	const requestRetweet = async ({
		id_str,
		retweeted,
	}: Tweet): Promise<Tweet | string> => {
		let err: null | string;
		if (retweeted) {
			err = await api.unretweet({ id: id_str });
		} else {
			err = await api.retweet({ id: id_str });
		}
		if (err !== null) return err;

		const res = await api.getTweet({ id: id_str });
		if (typeof res === "string") return res;
		const converted = convertTweetToDisplayable(res);
		setTimeline((prev) =>
			prev.map((t) => (t.id_str === id_str ? converted : t))
		);
		return converted;
	};

	const requestFavorite = async ({
		id_str,
		favorited,
	}: Tweet): Promise<Tweet | string> => {
		let err: null | string;
		if (favorited) {
			err = await api.unfavorite({ id: id_str });
		} else {
			err = await api.favorite({ id: id_str });
		}
		if (err !== null) return err;

		const res = await api.getTweet({ id: id_str });
		if (typeof res === "string") return res;
		const converted = convertTweetToDisplayable(res);
		setTimeline((prev) =>
			prev.map((t) => (t.id_str === id_str ? converted : t))
		);
		return converted;
	};

	const update = async (backward: boolean) => {
		setInProcess("update");
		if (backward) {
			const err = await paginator.fetchOlder();
			if (err !== null) {
				setError(err.message);
			}
		} else {
			const err = await paginator.fetchNewer();
			if (err !== null) {
				setError(err.message);
			}
		}
		setInProcess("none");
	};

	const newTweet = async () => {
		if (!valid) return;
		setInProcess("tweet");
		const err = await api.tweet({ status: tweetText });
		if (err !== null) {
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
		const res = await requestFavorite(focusedTweet);
		if (typeof res === "string") {
			setError(res);
		} else {
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
		const res = await requestRetweet(focusedTweet);
		if (typeof res === "string") {
			setError(res);
		} else {
			setRequestResult(
				`Successfully ${res.retweeted ? "retweeted" : "unretweeted"}: @${
					res.user.screen_name
				} "${res.full_text.split("\n").join(" ")}"`
			);
		}
		setInProcess("none");
	};

	useInput(
		(input, key) => {
			if (inProcess !== "none") return;

			if (key.upArrow || (key.shift && key.tab)) {
				mover.prev(() => update(false));
			} else if (key.downArrow || key.tab) {
				mover.next(() => update(true));
			} else if (key.pageUp) {
				mover.pageUp(() => update(false));
			} else if (key.pageDown) {
				mover.pageDown(() => update(true));
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
				{displayTimeline.map((t, i) => (
					<TweetItem
						key={i}
						tweet={t}
						isFocused={t.id_str === focusedTweet.id_str}
						inFav={t.id_str === focusedTweet.id_str && inProcess === "fav"}
						inRT={t.id_str === focusedTweet.id_str && inProcess === "rt"}
					/>
				))}
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
