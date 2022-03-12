import type { VFC } from "react";
import { Box } from "ink";
import type { TweetItemProps } from "./types";
import { TweetItem } from "./TweetItem";
import { TweetIndicator } from "./TweetIndicator";
import { TweetMenu } from "../../organisms/TweetMenu";

export const Selected: VFC<TweetItemProps> = ({ value: tweet }) => {
	return (
		<Box flexDirection="column" flexGrow={1}>
			<Box>
				<TweetIndicator isSelected={true} />
				<TweetItem tweet={tweet} />
			</Box>
			<TweetMenu />
		</Box>
	);
};
