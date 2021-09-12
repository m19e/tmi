import React, { useState } from "react";
import { Text, Box, useInput } from "ink";
import TextInput from "ink-text-input";
import { parseTweet, ParsedTweet } from "twitter-text";

import { Tweet } from "../types/twitter";
import { convertTweetToDisplayable } from "../lib";
import {
	getTweetApi,
	postTweetApi,
	postFavoriteApi,
	postUnfavoriteApi,
	postRetweetApi,
	postUnretweetApi,
} from "../lib/api";
import {
	useClient,
	useTimeline,
	useMover,
	useCursorIndex,
	getDisplayTimeline,
	getFocusedTweet,
} from "../hooks";
import TweetItem from "./TweetItem";
import Detail from "./Detail";
import Loader from "./Loader";

type Props = {
	onToggleList: () => void;
	onUpdate: (backward: boolean) => Promise<Tweet[]>;
};

type TimelineProcess =
	| "none"
	| "update"
	| "reply"
	| "rt"
	| "fav"
	| "tweet"
	| "delete";

const Timeline = ({ onToggleList, onUpdate }: Props) => {
	const [client] = useClient();
	const [, setTimeline] = useTimeline();
	const mover = useMover();
	const [, setCursor] = useCursorIndex();
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
			err = await postUnretweetApi(client, { id: id_str });
		} else {
			err = await postRetweetApi(client, { id: id_str });
		}
		if (err !== null) return err;

		const res = await getTweetApi(client, { id: id_str });
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
			err = await postUnfavoriteApi(client, { id: id_str });
		} else {
			err = await postFavoriteApi(client, { id: id_str });
		}
		if (err !== null) return err;

		const res = await getTweetApi(client, { id: id_str });
		if (typeof res === "string") return res;
		const converted = convertTweetToDisplayable(res);
		setTimeline((prev) =>
			prev.map((t) => (t.id_str === id_str ? converted : t))
		);
		return converted;
	};

	const update = async (backward: boolean) => {
		setInProcess("update");
		const res = await onUpdate(backward);
		if (res.length) {
			if (!backward) setCursor((prev) => prev + res.length);
			setTimeline((prev) =>
				backward ? prev.slice(0, -1).concat(res) : res.concat(prev)
			);
		}
		setInProcess("none");
	};

	const newTweet = async () => {
		if (!valid) return;
		setInProcess("tweet");
		const err = await postTweetApi(client, { status: tweetText });
		if (err !== null) {
			// onError()
		} else {
			setIsNewTweetOpen(false);
			setTweetText("");
		}
		setInProcess("none");
	};

	const fav = async () => {
		setInProcess("fav");
		const res = await requestFavorite(focusedTweet);
		if (typeof res === "string") {
			// onError(res)
		}
		setInProcess("none");
	};

	const rt = async () => {
		setInProcess("rt");
		const res = await requestRetweet(focusedTweet);
		if (typeof res === "string") {
			// onError(res)
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
			} else if (input === "l") {
				onToggleList();
			} else if (input === "r") {
				setIsTweetInDetailOpen(true);
				setStatus("detail");
			} else if (input === "t") {
				rt();
			} else if (input === "f") {
				fav();
			} else if (input === "n") {
				setIsNewTweetOpen(true);
			} else if (key.return) {
				setStatus("detail");
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
					return;
				}
				// Avoid warning: state update on an unmounted TextInput
				// Maybe caused by Node.js (single-threaded)?
				setTimeout(() => {
					setTweetText("");
					setIsNewTweetOpen(false);
				});
			} else if (waitReturn && key.return) {
				newTweet();
				setWaitReturn(false);
			}
		},
		{ isActive: status === "timeline" && isNewTweetOpen }
	);

	useInput(
		(input, key) => {
			if (key.escape) {
				setStatus("timeline");
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
	};

	const handleMention = () => {
		handleNewTweetChange(`@${focusedTweet.user.screen_name} `);
		setIsNewTweetOpen(true);
		setStatus("timeline");
	};

	return (
		<>
			{status === "timeline" && (
				<>
					<Text>
						{/* cursor:{cursor} focus:{focus} len:{timeline.length} */}
					</Text>
					<Box flexGrow={1} flexDirection="column">
						{displayTimeline.map((t, i) => (
							<TweetItem
								key={i}
								tweet={t}
								isFocused={t.id_str === focusedTweet.id_str}
								inFav={inProcess === "fav"}
								inRT={inProcess === "rt"}
							/>
						))}
					</Box>
					{isNewTweetOpen ? (
						<>
							<Box justifyContent="space-between" paddingX={1}>
								<Text>
									New Tweet{" "}
									<Loader loading={inProcess === "tweet"} rawColor="#00acee" />
								</Text>
								<Text>{280 - weightedLength}</Text>
							</Box>
							<Box borderStyle="round" borderColor="white">
								<TextInput
									placeholder="What's happening?"
									value={tweetText}
									onChange={handleNewTweetChange}
									onSubmit={() => setWaitReturn(valid)}
									focus={!waitReturn}
								/>
							</Box>
							<Box justifyContent="flex-start" paddingX={1}>
								{waitReturn ? (
									<Text>[Enter] tweet [ESC] cancel</Text>
								) : (
									<Text>[Enter] done [ESC] close</Text>
								)}
							</Box>
						</>
					) : (
						<Text>
							[R] reply [T] retweet [F] favorite [N] tweet [Enter] detail [L]
							list
						</Text>
					)}
				</>
			)}
			{status === "detail" && (
				<Detail
					tweet={focusedTweet}
					onMention={handleMention}
					onRemove={removeFocusedTweetFromTimeline}
					isTweetOpen={isTweetInDetailOpen}
					setIsTweetOpen={setIsTweetInDetailOpen}
					inProcess={inProcess}
					setInProcess={setInProcess}
				/>
			)}
		</>
	);
};

export default Timeline;
