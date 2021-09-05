import React, { useState } from "react";
import type { FC } from "react";
import { Text, Box, Newline, useInput } from "ink";
import Divider from "ink-divider";
import useDimensions from "ink-use-stdout-dimensions";
import TextInput from "ink-text-input";
import SelectInput, { ItemProps } from "ink-select-input";
import { parseTweet, ParsedTweet } from "twitter-text";

import { Tweet } from "../types/twitter";
import { getDisplayTime } from "../lib";
import { useUserId } from "../hooks";
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
			} else if (input === "r") {
				// reply();
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
		{ isActive: status === "timeline" && isNewTweetOpen }
	);

	useInput(
		(input, key) => {
			if (key.escape) {
				setStatus("timeline");
			}
		},
		{ isActive: status === "detail" }
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
						<Text>
							[R] reply [T] retweet [F] favorite [N] tweet [Enter] detail
						</Text>
					)}
				</>
			)}
			{status === "detail" && <Detail tweet={displayTimeline[focus]} />}
		</>
	);
};

const Detail = ({ tweet }: { tweet: Tweet }) => {
	const t = tweet.retweeted_status ?? tweet;
	const time = getDisplayTime(t.created_at);
	const displayFavRT = t.retweet_count !== 0 || t.favorite_count !== 0;

	const [cols] = useDimensions();
	const [userId] = useUserId();
	const myTweet = t.user.id_str === userId;
	let selectItems: SelectItemProps[] = [
		{
			label: `Tweet to @${t.user.screen_name}`,
			value: "mention",
			newline: myTweet,
		},
	];
	if (myTweet) {
		selectItems = selectItems.concat([
			{ label: "Delete", value: "delete" },
			{ label: "Re-draft", value: "redraft" },
		]);
	}

	return (
		<>
			<Box flexGrow={1} flexDirection="column" alignItems="center">
				<Box
					flexDirection="column"
					minWidth={30}
					width={Math.floor(cols / 2)}
					paddingX={1}
				>
					<Text dimColor>
						{t.user.id_str === userId && "This is my tweet."}
					</Text>
					<Text color="#00acee">{t.user.name}</Text>
					<Text dimColor>
						@{t.user.screen_name}
						{t.user.protected && " 🔒"}
					</Text>
					<Box flexDirection="column" paddingY={1}>
						<Text>{t.full_text}</Text>
						{t.entities.media && <Text dimColor>(with Media)</Text>}
					</Box>
					<Text dimColor>
						{time}・{t.source.replace(/(<([^>]+)>)/gi, "")}
					</Text>
				</Box>
				<Divider width={Math.max(30, Math.floor(cols / 2))} />
				{displayFavRT && (
					<>
						<Box minWidth={30} width={Math.floor(cols / 2)} paddingX={1}>
							<Text>
								{t.retweet_count !== 0 && (
									<>
										<Text>{t.retweet_count} </Text>
										<Text color={t.retweeted ? "green" : "white"}>RT </Text>
									</>
								)}
								{t.favorite_count !== 0 && (
									<>
										<Text>{t.favorite_count} </Text>
										<Text color={t.favorited ? "yellow" : "white"}>fav </Text>
									</>
								)}
							</Text>
						</Box>
						<Divider width={Math.max(30, Math.floor(cols / 2))} />
					</>
				)}
				<Box
					justifyContent="flex-end"
					minWidth={30}
					width={Math.floor(cols / 2)}
				>
					<Box paddingX={1} borderStyle="round" borderColor="gray">
						<SelectInput
							items={selectItems}
							itemComponent={SelectItem}
							indicatorComponent={Indicator}
						/>
					</Box>
				</Box>
			</Box>
			<Text>[R] reply [T] retweet [F] favorite [X] expand menu</Text>
		</>
	);
};

interface SelectItemProps extends ItemProps {
	value: string;
	newline?: boolean;
}

const SelectItem: FC<SelectItemProps> = ({
	isSelected = false,
	label,
	newline = false,
}) => (
	<>
		<Text color={isSelected ? "#00acee" : undefined}>{label}</Text>
		{newline && <Newline />}
	</>
);

const Indicator: FC<{
	isSelected?: boolean;
}> = ({ isSelected = false }) => (
	<Box marginRight={1}>
		{isSelected ? <Text color="#00acee">❯</Text> : <Text> </Text>}
	</Box>
);

export default Timeline;
