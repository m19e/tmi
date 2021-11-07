import React, { useState } from "react";
import type { VFC } from "react";
import { Box, useInput } from "ink";
import type { ItemProps } from "ink-select-input";
import type { TweetV1 } from "twitter-api-v2";
import { parseTweet, ParsedTweet } from "twitter-text";

import type { TimelineProcess } from "../../types";
import {
	useUserConfig,
	useError,
	useRequestResult,
	useHint,
} from "../../hooks";
import { useApi } from "../../hooks/api";
import TweetItem from "../molecules/TweetItem";
import SelectInput from "../molecules/SelectInput";
import NewTweetBox from "../molecules/NewTweetBox";

type TweetMenuActionTarget = "user" | "retweets" | "quotes" | "client";

type TweetMenuAction =
	| "mention"
	| "delete"
	| "re-draft"
	| "block"
	| `mute-${TweetMenuActionTarget}`;

interface SelectItemProps extends ItemProps {
	value: TweetMenuAction;
}

interface Props {
	tweet: TweetV1;
	onMention: () => void;
	onRemove: (options?: { redraft: boolean }) => void;
	isTweetOpen: boolean;
	setIsTweetOpen: (b: boolean) => void;
	inProcess: TimelineProcess;
	setInProcess: (p: TimelineProcess) => void;
}

const Detail: VFC<Props> = ({
	tweet,
	onMention,
	onRemove,
	isTweetOpen,
	setIsTweetOpen,
	inProcess,
	setInProcess,
}) => {
	const api = useApi();
	const [{ userId }] = useUserConfig();
	const [, setError] = useError();
	const [, setRequestResult] = useRequestResult();
	const [, setHintKey] = useHint();

	const [tweetMode, setTweetMode] = useState<"none" | "reply" | "quote">(
		"none"
	);
	const openReplyTweet = () => {
		setTweetMode("reply");
		setRequestResult(undefined);
		setIsTweetOpen(true);
	};
	const openQuoteTweet = () => {
		setTweetMode("quote");
		setRequestResult(undefined);
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
	const selectItems: Array<SelectItemProps> = [].concat(
		[
			{
				label: `Tweet to @${t.user.screen_name}`,
				value: "mention",
			},
		],
		myTweet
			? [
					{ label: "Delete", value: "delete" },
					{ label: "Re-draft", value: "re-draft" },
			  ]
			: [
					{ label: `Mute @${t.user.screen_name}`, value: "mute-user" },
					{ label: "Mute Retweets from User", value: "mute-retweets" },
					{ label: "Mute Quotes from User", value: "mute-quotes" },
					{ label: `Block @${t.user.screen_name}`, value: "block" },
			  ],
		[
			{
				label: `Mute "${t.source.replace(/(<([^>]+)>)/gi, "")}"`,
				value: "mute-client",
			},
		]
	);

	const resetTweetState = () => {
		setIsTweetOpen(false);
		setTweetMode("none");
		setWaitReturn(false);
		setTweetText("");
		setParsedTweet(parseTweet(""));
	};

	const reply = async () => {
		setInProcess("reply");
		const error = await api.reply(tweetText, t.id_str);
		setInProcess("none");
		if (typeof error === "string") {
			setError(error);
			return;
		}
		setRequestResult(
			`Successfully replied to @${tweet.user.screen_name}: "${tweetText}"`
		);
		resetTweetState();
		setHintKey("timeline/detail");
	};

	const quote = async () => {
		setInProcess("quote");
		const error = await api.quote(tweetText, quoteUrl);
		setInProcess("none");
		if (typeof error === "string") {
			setError(error);
			return;
		}
		setRequestResult(`Successfully quoted: "${tweetText}"`);
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
		const error = await api.deleteTweet(t.id_str);
		setInProcess("none");
		if (typeof error === "string") {
			setError(error);
			return;
		}
		setRequestResult(`Successfully deleted: "${tweet.full_text}"`);
		onRemove({ redraft });
		resetTweetState();
	};

	useInput(
		(input, _) => {
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
		(_, key) => {
			if (key.escape && waitReturn) {
				setWaitReturn(false);
				setHintKey("timeline/detail/input");
			} else if (key.escape) {
				resetTweetState();
				setHintKey("timeline/detail");
			} else if (key.return && waitReturn) {
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

	const handleSelectMenu = ({ value }: SelectItemProps) => {
		if (value === "mention") {
			onMention();
		} else if (value === "delete") {
			deleteTweet();
		} else if (value === "re-draft") {
			deleteTweet({ redraft: true });
		}
	};

	const handleWaitReturn = () => {
		setWaitReturn(valid);
		if (valid) setHintKey("timeline/detail/wait-return");
	};

	return (
		<Box flexGrow={1} flexDirection="column">
			<TweetItem
				tweet={tweet}
				inFav={inProcess === "fav"}
				inRT={inProcess === "rt"}
			/>
			<Box flexDirection="column" marginLeft={2} marginBottom={1}>
				{(() => {
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
								onSubmit={handleWaitReturn}
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
								onChange={handleTweetChange}
								onSubmit={handleWaitReturn}
							/>
						);
					}

					return (
						<SelectInput items={selectItems} onSelect={handleSelectMenu} />
					);
				})()}
			</Box>
		</Box>
	);
};

export default Detail;
