import * as React from "react";
import type { FC } from "react";
import { Box, Text } from "ink";
import figures from "../../../lib/sindresorhus/figures";

export interface Props {
	isSelected?: boolean;
}

export const Indicator: FC<Props> = ({ isSelected = false }) => (
	<Box marginRight={1}>
		{isSelected ? <Text color="blue">{figures.pointer}</Text> : <Text> </Text>}
	</Box>
);
