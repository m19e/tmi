import { useState, useCallback } from "react";
import type { VFC } from "react";
import { Text, Box, useInput } from "ink";
import TextInput from "ink-text-input";
import type { TweetV1 } from "twitter-api-v2";
import { parseTweet } from "twitter-text";
import type { ParsedTweet } from "twitter-text";

import figures from "../../../lib/sindresorhus/figures";
import { useHint } from "../../../hooks";
import Quoted from "../../molecules/Quoted";
import Counter from "../../atoms/CharCounter";
import { TCText } from "../../atoms/TwitterColoredText";
import { Space } from "../../atoms/Space";

interface TweetTextStates {
	tweetText: string;
	weightedLength: number;
	invalid: boolean;
}

const useTweetText = (
	initialText?: string
): [TweetTextStates, (t: string) => void] => {
	const [tweetText, setText] = useState(initialText ?? "");
	const [{ valid, weightedLength }, setParsedTweet] = useState<ParsedTweet>(
		parseTweet(initialText ?? "")
	);

	const invalid = !valid && weightedLength !== 0;
	const setTweetText = (text: string) => {
		setText(text);
		setParsedTweet(parseTweet(text));
	};

	return [{ tweetText, weightedLength, invalid }, setTweetText];
};

type TweetBoxType = "new" | "reply" | "quote";

const placeholderMap = new Map<TweetBoxType, string>([
	["new", "What's happening?"],
	["reply", "Tweet your reply"],
	["quote", "Add a comment"],
]);

const TweetBoxHeader: VFC<{ type: TweetBoxType; tweet: TweetV1 }> = ({
	type,
	tweet,
}) => {
	if (type === "reply") {
		return (
			<Text>
				Replying to <TCText>@{tweet.user.screen_name}</TCText>
			</Text>
		);
	}
	if (type === "quote") {
		return (
			<Text>
				Quote <TCText>@{tweet.user.screen_name}</TCText>'s tweet
			</Text>
		);
	}
	return <Text>Tweet</Text>;
};

interface Props {
	type: TweetBoxType;
	onSubmit: (v: string) => Promise<void>;
	tweet?: TweetV1;
	initialText?: string;
}

export const NewTweetBox: VFC<Props> = ({
	type,
	onSubmit,
	tweet = undefined,
	initialText = undefined,
}) => {
	const [, setHintKey] = useHint();

	const [{ tweetText, weightedLength, invalid }, setTweetText] =
		useTweetText(initialText);
	const [waitReturn, setWaitReturn] = useState(false);

	const placeholder = placeholderMap.get(type);

	useInput(
		useCallback(
			(_, key) => {
				if (key.return) {
					submitTweet(tweetText);
				} else if (key.escape) {
					setWaitReturn(false);
					setHintKey((prev) => {
						if (prev === "timeline/new/wait-return") {
							return "timeline/new/input";
						}
						if (prev === "timeline/detail/wait-return") {
							return "timeline/detail/input";
						}
					});
				}
			},
			[tweetText]
		),
		{ isActive: waitReturn }
	);

	const submitTweet = async (text: string) => {
		setWaitReturn(false);
		await onSubmit(text);
		setHintKey("timeline/detail");
	};

	const handleWaitReturn = useCallback(() => {
		if (invalid) return;
		setWaitReturn(true);
		setHintKey((prev) => {
			if (prev === "timeline/new/input") {
				return "timeline/new/wait-return";
			}
			if (prev === "timeline/detail/input") {
				return "timeline/detail/wait-return";
			}
		});
	}, [invalid]);

	return (
		<Box flexDirection="column">
			<Text color="gray">
				<TweetBoxHeader type={type} tweet={tweet} />
				<Space />
				<Counter invalid={invalid} length={weightedLength} />
			</Text>
			<Box marginY={1}>
				<Box width={2} flexDirection="column">
					<TCText>{figures.squareLeft}</TCText>
				</Box>
				<Box flexDirection="column" flexGrow={1}>
					<TextInput
						placeholder={placeholder}
						focus={!waitReturn}
						value={tweetText}
						onChange={setTweetText}
						onSubmit={handleWaitReturn}
					/>
					<Quoted tweet={tweet} />
				</Box>
			</Box>
		</Box>
	);
};
