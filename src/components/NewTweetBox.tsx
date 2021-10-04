import React from "react";
import type { FC } from "react";
import { Text, Box } from "ink";
import TextInput from "ink-text-input";

import { Tweet } from "../types/twitter";
import figures from "../lib/sindresorhus/figures";
import Quoted from "./Quoted";
import Loader from "./Loader";
import Counter from "./TweetCharCounter";

interface Props {
	type: "new" | "reply" | "quote";
	loading: boolean;
	tweet: Tweet;
	invalid: boolean;
	length: number;
	placeholder?: string;
	focus?: boolean;
	value: string;
	onChange: (value: string) => void;
	onSubmit?: (value: string) => void;
}

const NewTweetHeader: FC<{
	type: Props["type"];
	loading: Props["loading"];
	screenName?: string;
}> = ({ type, loading, screenName }) => {
	switch (type) {
		case "new":
			return (
				<>
					Tweet <Loader loading={loading} color="#00acee" />
				</>
			);
		case "reply":
			return (
				<>
					Replying to <Text color="#00acee">@{screenName} </Text>
					<Loader loading={loading} color="#00acee" />
				</>
			);
		case "quote":
			return (
				<>
					Quote <Text color="#00acee">@{screenName}</Text>'s tweet{" "}
					<Loader loading={loading} color="green" />
				</>
			);
	}
};

const NewTweetBox: FC<Props> = ({
	type,
	loading,
	tweet,
	invalid,
	length,
	placeholder,
	focus,
	value,
	onChange,
	onSubmit,
}) => {
	const Header: FC = () => {
		if (type === "new") {
			return (
				<>
					Tweet <Loader loading={loading} color="#00acee" />{" "}
				</>
			);
		}
		if (type === "reply") {
			return (
				<>
					Replying to <Text color="#00acee">@{tweet.user.screen_name} </Text>
					<Loader loading={loading} color="#00acee" />{" "}
				</>
			);
		}
		if (type === "quote") {
			return (
				<>
					Quote <Text color="#00acee">@{tweet.user.screen_name}</Text>'s tweet{" "}
					<Loader loading={loading} color="green" />{" "}
				</>
			);
		}
	};

	return (
		<>
			<Text color="gray">
				<Header />
				<Counter invalid={invalid} length={length} />
			</Text>
			<Box marginY={1}>
				<Box width={2} flexDirection="column">
					<Text color="#00acee">{figures.squareLeft}</Text>
				</Box>
				<Box flexDirection="column" flexGrow={1}>
					<TextInput
						placeholder={placeholder}
						focus={focus}
						value={value}
						onChange={onChange}
						onSubmit={onSubmit}
					/>
					{type === "quote" && <Quoted tweet={tweet} />}
				</Box>
			</Box>
		</>
	);
};

export default NewTweetBox;
