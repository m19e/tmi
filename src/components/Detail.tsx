import React, { useState } from "react";
import type { FC, VFC } from "react";
import { Text, Box, Newline, useInput } from "ink";
import SelectInput, { ItemProps } from "ink-select-input";
import { parseTweet, ParsedTweet } from "twitter-text";

import { TimelineProcess } from "../types";
import { Tweet } from "../types/twitter";
import { postTweetApi, postReplyApi, postDeleteTweetApi } from "../lib/api";
import figures from "../lib/sindresorhus/figures";
import { useUserId, useClient, useHint } from "../hooks";
import TweetItem from "./TweetItem";
import NewTweetBox from "./NewTweetBox";

const Borderless = ({
	tweet,
	onMention,
	onRemove,
	isTweetOpen,
	setIsTweetOpen,
	inProcess,
	setInProcess,
}: {
	tweet: Tweet;
	onMention: () => void;
	onRemove: (options?: { redraft: boolean }) => void;
	isTweetOpen: boolean;
	setIsTweetOpen: (b: boolean) => void;
	inProcess: TimelineProcess;
	setInProcess: (p: TimelineProcess) => void;
}) => {
	const [client] = useClient();
	const [userId] = useUserId();
	const [, setHintKey] = useHint();

	const [tweetMode, setTweetMode] = useState<"none" | "reply" | "quote">(
		"none"
	);
	const openReplyTweet = () => {
		setTweetMode("reply");
		setIsTweetOpen(true);
	};
	const openQuoteTweet = () => {
		setTweetMode("quote");
		setIsTweetOpen(true);
	};

	const [waitReturn, setWaitReturn] = useState(false);
	const [tweetText, setTweetText] = useState("");
	const [{ weightedLength, valid }, setParsedTweet] = useState<ParsedTweet>(
		parseTweet("")
	);

	const t = tweet.retweeted_status ?? tweet;
	const quoteUrl = `https://twitter.com/${t.user.screen_name}/status/${t.id_str}`;

	const myTweet = t.user.id_str === userId;
	let selectItems: SelectItemProps[] = [
		{
			label: `Tweet to @${t.user.screen_name}`,
			value: "mention",
		},
	];
	if (myTweet) {
		selectItems = selectItems.concat([
			{ label: "Delete", value: "delete" },
			{ label: "Re-draft", value: "re-draft" },
		]);
	} else {
		selectItems = selectItems.concat([
			{ label: `Mute @${t.user.screen_name}`, value: "mute-user" },
			{ label: "Mute Retweets from User", value: "mute-retweets" },
			{ label: "Mute Quotes from User", value: "mute-quotes" },
			{ label: `Block @${t.user.screen_name}`, value: "block" },
		]);
	}
	selectItems = selectItems.concat([
		{
			label: `Mute "${t.source.replace(/(<([^>]+)>)/gi, "")}"`,
			value: "mute-client",
		},
	]);

	const resetTweetState = () => {
		setIsTweetOpen(false);
		setTweetMode("none");
		setWaitReturn(false);
		setTweetText("");
		setParsedTweet(parseTweet(""));
	};

	const reply = async () => {
		setInProcess("reply");
		const error = await postReplyApi(client, {
			status: tweetText,
			in_reply_to_status_id: t.id_str,
		});
		setInProcess("none");
		if (error !== null) {
			// onError()
			return;
		}
		resetTweetState();
		setHintKey("timeline/detail");
	};

	const quote = async () => {
		setInProcess("quote");
		const error = await postTweetApi(client, {
			status: `${tweetText} ${quoteUrl}`,
		});
		setInProcess("none");
		if (error !== null) {
			// onError()
			return;
		}
		resetTweetState();
		setHintKey("timeline/detail");
	};

	const deleteTweet = async (
		{
			redraft,
		}: {
			redraft: boolean;
		} = { redraft: false }
	) => {
		setInProcess("delete");
		const error = await postDeleteTweetApi(client, { id: t.id_str });
		setInProcess("none");
		if (error !== null) {
			// onError
			return;
		}
		onRemove({ redraft });
		resetTweetState();
	};

	useInput(
		(input, key) => {
			if (input === "r") {
				openReplyTweet();
				setHintKey("timeline/detail/input");
			} else if (input === "q") {
				openQuoteTweet();
				setHintKey("timeline/detail/input");
			}
		},
		{ isActive: !isTweetOpen && inProcess === "none" }
	);

	useInput(
		(input, key) => {
			if (key.escape) {
				if (waitReturn) {
					setWaitReturn(false);
					setHintKey("timeline/detail/input");
				} else {
					// Avoid warning: state update on an unmounted TextInput
					// Maybe caused by Node.js (single-threaded)?
					setTimeout(() => {
						resetTweetState();
						setHintKey("timeline/detail");
					});
				}
			} else if (waitReturn && key.return) {
				if (tweetMode === "reply") reply();
				if (tweetMode === "quote") quote();
			}
		},
		{ isActive: isTweetOpen && inProcess === "none" }
	);

	const handleTweetChange = (value: string) => {
		setTweetText(value);
		setParsedTweet(parseTweet(value));
	};

	const handleQuoteChange = (value: string) => {
		setTweetText(value);
		setParsedTweet(parseTweet(`${value} ${quoteUrl}`));
	};

	const handleSelectMenu = ({ value }: SelectItemProps) => {
		if (value === "mention") {
			onMention();
		} else if (value === "delete") {
			deleteTweet();
		} else if (value === "re-draft") {
			deleteTweet({ redraft: true });
		}
	};

	const handleWaitReturn = (v: boolean) => {
		setWaitReturn(v);
		if (v) setHintKey("timeline/detail/wait-return");
	};

	const Component: VFC = () => {
		if (tweetMode === "reply") {
			return (
				<NewTweetBox
					type="reply"
					loading={inProcess === "reply"}
					tweet={tweet}
					invalid={!valid && weightedLength !== 0}
					length={weightedLength}
					placeholder={myTweet ? "Add another Tweet" : "Tweet your reply"}
					focus={!waitReturn}
					value={tweetText}
					onChange={handleTweetChange}
					onSubmit={() => handleWaitReturn(valid)}
				/>
			);
		}
		if (tweetMode === "quote") {
			return (
				<NewTweetBox
					type="quote"
					loading={inProcess === "quote"}
					tweet={tweet}
					invalid={!valid && weightedLength !== 0}
					length={weightedLength}
					placeholder="Add a comment"
					focus={!waitReturn}
					value={tweetText}
					onChange={handleQuoteChange}
					onSubmit={() => handleWaitReturn(valid)}
				/>
			);
		}

		return (
			<SelectInput
				items={selectItems}
				itemComponent={SelectItem}
				indicatorComponent={Indicator}
				onSelect={handleSelectMenu}
			/>
		);
	};

	return (
		<Box flexGrow={1} flexDirection="column">
			<TweetItem
				tweet={tweet}
				inFav={inProcess === "fav"}
				inRT={inProcess === "rt"}
			/>
			<Box flexDirection="column" marginLeft={2} marginBottom={1}>
				<Component />
			</Box>
		</Box>
	);
};

type TweetMenuActionTarget = "user" | "retweets" | "quotes" | "client";

type TweetMenuAction =
	| "mention"
	| "delete"
	| "re-draft"
	| "block"
	| `mute-${TweetMenuActionTarget}`;

interface SelectItemProps extends ItemProps {
	value: TweetMenuAction;
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
		{isSelected ? (
			<Text color="#00acee">{figures.pointer}</Text>
		) : (
			<Text> </Text>
		)}
	</Box>
);

export default Borderless;
