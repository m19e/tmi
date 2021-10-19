import React from "react";
import type { VFC } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface Props {
	url: string;
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
}

const PinAuthInput: VFC<Props> = ({ url, value, onChange, onSubmit }) => {
	return (
		<Box flexDirection="column">
			<Text color="redBright">Open URL and enter PIN.</Text>
			<Text>{url}</Text>
			<Text>
				<Text>PIN: </Text>
				<TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
			</Text>
		</Box>
	);
};

export default PinAuthInput;
