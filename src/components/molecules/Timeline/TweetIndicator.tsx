import type { VFC } from "react";
import { Box, Text } from "ink";
import figures from "../../../lib/sindresorhus/figures";
import { Space } from "../../atoms/Space";

export const TweetIndicator: VFC<{ isSelected: boolean }> = ({
	isSelected = false,
}) => (
	<Box width={2} height={2} flexDirection="column">
		{isSelected ? (
			<>
				<Text color="#00acee">{figures.square}</Text>
				<Text color="#00acee">{figures.square}</Text>
			</>
		) : (
			<>
				<Space />
				<Space />
			</>
		)}
	</Box>
);
