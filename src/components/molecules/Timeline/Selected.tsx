import type { VFC } from "react";
import { Box } from "ink";
import type { TweetItemProps, Updater } from "./types";
import { TweetMenu } from "../../organisms/TweetMenu";
import { TweetItem } from "./TweetItem";
import { TweetIndicator } from "./TweetIndicator";

export const curriedSelected: (updater: Updater) => VFC<TweetItemProps> =
	(updater) =>
	({ value: tweet }) => {
		return (
			<Box flexDirection="column">
				<Box>
					<TweetIndicator isSelected={true} />
					<TweetItem tweet={tweet} />
				</Box>
				<Box marginLeft={2}>
					<TweetMenu tweet={tweet} updater={updater} />
				</Box>
			</Box>
		);
	};
