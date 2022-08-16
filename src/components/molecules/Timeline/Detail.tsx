import type { VFC } from "react";
import { Box } from "ink";
import type { TweetV1 } from "twitter-api-v2";
import type { Updater } from "./types";
import { TweetMenu } from "../../organisms/TweetMenu";
import { TweetItem } from "./TweetItem";
import { TweetIndicator } from "./TweetIndicator";

export interface Props {
	tweet: TweetV1;
	updater: Updater;
}

export const TweetDetail: VFC<Props> = ({ tweet, updater }) => {
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
