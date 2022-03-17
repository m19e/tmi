import { useState, useCallback } from "react";
import type { VFC } from "react";
import { Text, Box, useInput } from "ink";
import TextInput from "ink-text-input";
import { parseTweet } from "twitter-text";
import type { ParsedTweet } from "twitter-text";

import figures from "../../../lib/sindresorhus/figures";
import Counter from "../../atoms/CharCounter";

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

interface Props {
	type: TweetBoxType;
	onSubmit: (v: string) => void;
	initialText?: string;
}

export const NewTweetBox: VFC<Props> = ({
	onSubmit,
	initialText = undefined,
}) => {
	const [{ tweetText, weightedLength, invalid }, setTweetText] =
		useTweetText(initialText);
	const [waitReturn, setWaitReturn] = useState(false);

	useInput(
		useCallback(
			(_, key) => {
				if (key.return) {
					onSubmit(tweetText);
					setWaitReturn(false);
				} else if (key.escape) {
					setWaitReturn(false);
				}
			},
			[tweetText]
		),
		{ isActive: waitReturn }
	);

	const handleWaitReturn = () => {
		// setHint("timeline/detail/wait-return")
		setWaitReturn(true);
	};

	return (
		<Box flexDirection="column">
			<Text color="gray">
				<Text>Header is here. </Text>
				<Counter invalid={invalid} length={weightedLength} />
			</Text>
			<Box marginY={1}>
				<Box width={2} flexDirection="column">
					<Text color="#00acee">{figures.squareLeft}</Text>
				</Box>
				<Box flexDirection="column" flexGrow={1}>
					<TextInput
						placeholder={""}
						focus={!waitReturn}
						value={tweetText}
						onChange={setTweetText}
						onSubmit={handleWaitReturn}
					/>
				</Box>
			</Box>
		</Box>
	);
};
