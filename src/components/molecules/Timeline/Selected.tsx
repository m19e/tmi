import type { VFC } from "react";
import { Box } from "ink";
import type { TweetItemProps } from "./types";
import { TweetItem } from "./TweetItem";
import { TweetIndicator } from "./TweetIndicator";

export const Selected: VFC<TweetItemProps> = ({ value: tweet }) => {
	return (
		<Box>
			<TweetIndicator isSelected={true} />
			<TweetItem tweet={tweet} />
		</Box>
	);
};
