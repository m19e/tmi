import React from "react";
import type { VFC } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface Props {
	oauthToken: string;
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
}

const PinAuthInput: VFC<Props> = ({
	oauthToken,
	value,
	onChange,
	onSubmit,
}) => {
	return (
		<Box flexDirection="column">
			<Text color="redBright">Open URL and enter PIN.</Text>
			<Text>{`https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}`}</Text>
			<Text>
				<Text>PIN: </Text>
				<TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
			</Text>
		</Box>
	);
};

export default PinAuthInput;
