import React, { useState } from "react";
import { Text, Box, useInput } from "ink";
import TextInput from "ink-text-input";
import { parseTweet, ParsedTweet } from "twitter-text";

import { Tweet } from "../types/twitter";
import TweetItem from "./TweetItem";
import Spinner from "./Spinner";

const DISPLAY_TWEETS_COUNT = 5;

type Props = {
	timeline: Tweet[];
	onToggleList: () => void;
	onUpdate: (backward: boolean) => Promise<number>;
	onNewTweet: (s: string) => Promise<null | any>;
	onFav: (t: Tweet) => Promise<Tweet | null>;
	onRT: (t: Tweet) => Promise<Tweet | null>;
};

const Timeline = ({
	timeline,
	onToggleList,
	onUpdate,
	onNewTweet,
	onFav,
	onRT,
}: Props) => {
	const [cursor, setCursor] = useState(0);
	const [focus, setFocus] = useState(0);
	const [displayTimeline, setDisplayTimeline] = useState<Tweet[]>(
		timeline.slice(0, DISPLAY_TWEETS_COUNT)
	);
	const [fetching, setFetching] = useState(false);
	const [inFav, setInFav] = useState(false);
	const [inRT, setInRT] = useState(false);
	const [inNewTweet, setInNewTweet] = useState(false);

	const [isNewTweetOpen, setIsNewTweetOpen] = useState(false);
	const [waitReturn, setWaitReturn] = useState(false);
	const [tweetText, setTweetText] = useState("");
	const [{ weightedLength, valid }, setParsedTweet] = useState<ParsedTweet>(
		parseTweet("")
	);

	const [status, setStatus] = useState<"timeline" | "detail">("timeline");

	const update = async (backward: boolean) => {
		setFetching(true);
		const len = await onUpdate(backward);
		if (!backward) setCursor(cursor + len);
		setFetching(false);
	};

	const newTweet = async () => {
		if (!valid) return;
		setFetching(true);
		setInNewTweet(true);
		const err = await onNewTweet(tweetText);
		setInNewTweet(false);
		if (err !== null) {
			// onError()
		} else {
			setIsNewTweetOpen(false);
			setTweetText("");
		}
		setFetching(false);
	};

	const fav = async () => {
		setFetching(true);
		setInFav(true);
		const res = await onFav(displayTimeline[focus]);
		if (res === null) {
			// onError()
		} else {
			setDisplayTimeline((prev) =>
				prev.map((t) => (t.id_str === res.id_str ? res : t))
			);
		}
		setInFav(false);
		setFetching(false);
	};

	const rt = async () => {
		setFetching(true);
		setInRT(true);
		const res = await onRT(displayTimeline[focus]);
		if (res === null) {
			// onError()
		} else {
			setDisplayTimeline((prev) =>
				prev.map((t) => (t.id_str === res.id_str ? res : t))
			);
		}
		setInRT(false);
		setFetching(false);
	};

	useInput(
		(input, key) => {
			if (fetching) return;

			if (key.upArrow || (key.shift && key.tab)) {
				if (focus === 0) {
					if (cursor === 0) {
						update(false);
					} else {
						setDisplayTimeline(
							timeline.slice(cursor - 1, cursor + DISPLAY_TWEETS_COUNT - 1)
						);
						setCursor((prev) => prev - 1);
					}
				} else {
					setFocus((prev) => prev - 1);
				}
			} else if (key.downArrow || key.tab) {
				if (focus === DISPLAY_TWEETS_COUNT - 1) {
					if (cursor + DISPLAY_TWEETS_COUNT + 1 > timeline.length) {
						update(true);
					} else {
						setDisplayTimeline(
							timeline.slice(cursor + 1, cursor + DISPLAY_TWEETS_COUNT + 1)
						);
						setCursor((prev) => prev + 1);
					}
				} else {
					setFocus((prev) => prev + 1);
				}
			} else if (key.pageUp) {
				if (cursor + focus < DISPLAY_TWEETS_COUNT) {
					update(false);
				} else {
					const newCursor = Math.max(cursor - DISPLAY_TWEETS_COUNT, 0);
					setDisplayTimeline(
						timeline.slice(newCursor, newCursor + DISPLAY_TWEETS_COUNT)
					);
					setCursor(newCursor);
				}
			} else if (key.pageDown) {
				if (cursor + DISPLAY_TWEETS_COUNT * 2 > timeline.length) {
					update(true);
				} else {
					const newCursor = Math.min(
						cursor + DISPLAY_TWEETS_COUNT,
						timeline.length - DISPLAY_TWEETS_COUNT - 1
					);
					setDisplayTimeline(
						timeline.slice(newCursor, newCursor + DISPLAY_TWEETS_COUNT)
					);
					setCursor(newCursor);
				}
			} else if (input === "l") {
				onToggleList();
			} else if (input === "n") {
				setIsNewTweetOpen(true);
			} else if (input === "f") {
				fav();
			} else if (input === "r") {
				rt();
			}
		},
		{ isActive: !isNewTweetOpen }
	);

	useInput(
		(_, key) => {
			if (fetching) return;

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
		{ isActive: isNewTweetOpen }
	);

	const handleNewTweetChange = (value: string) => {
		setTweetText(value);
		setParsedTweet(parseTweet(value));
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
								isFocused={focus === i}
								inFav={focus === i && inFav}
								inRT={focus === i && inRT}
							/>
						))}
					</Box>
					{isNewTweetOpen ? (
						<>
							<Box justifyContent="space-between" paddingX={1}>
								<Text>
									New Tweet{" "}
									{inNewTweet && (
										<Text color="#00acee">
											<Spinner />
										</Text>
									)}
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
						<Text>[N] tweet [R] retweet [F] favorite</Text>
					)}
				</>
			)}
		</>
	);
};

export default Timeline;
