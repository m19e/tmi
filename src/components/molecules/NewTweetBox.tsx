import React from "react";
import type { VFC } from "react";
import { Text, Box } from "ink";
import TextInput from "ink-text-input";

import { Tweet } from "../../types/twitter";
import figures from "../../lib/sindresorhus/figures";
import Quoted from "./Quoted";
import Loader from "./Loader";
import Counter from "../atoms/CharCounter";

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

const NewTweetBox: VFC<Props> = ({
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
	const Header: VFC = () => {
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

	const Q: VFC = () => {
		if (type === "quote") {
			return <Quoted tweet={tweet} />;
		}
		return null;
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
					<Q />
				</Box>
			</Box>
		</>
	);
};

export default NewTweetBox;
