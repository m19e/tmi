import type { VFC } from "react";
import type { TweetV1 } from "twitter-api-v2";
import stc from "string-to-color";
import { Box, Text } from "ink";

import { getDisplayTimeAgo } from "../../lib";
import figures from "../../lib/sindresorhus/figures";
import { NoRotateSelect } from "./SelectInput";
import type { Item } from "./SelectInput";

interface IndicatorProps {
	isSelected?: boolean;
}

const IndicatorComponent: VFC<IndicatorProps> = ({ isSelected = false }) => (
	<Box width={2} height={2} flexDirection="column">
		{isSelected ? (
			<>
				<Text color="#00acee">{figures.square}</Text>
				<Text color="#00acee">{figures.square}</Text>
			</>
		) : (
			<>
				<Text> </Text>
				<Text> </Text>
			</>
		)}
	</Box>
);

interface ItemProps {
	isSelected?: boolean;
	label: string;
	value: TweetV1;
}

const ItemComponent: VFC<ItemProps> = ({ value: tweet }) => {
	const t = tweet.retweeted_status ?? tweet;
	const ago = getDisplayTimeAgo(t.created_at);
	const generatedColor = stc(t.user.screen_name);

	return (
		<Box flexDirection="column" marginBottom={1}>
			<Text>USER name, screen_name, protected, retweeted, fav, rt</Text>
			<Text>in_reply_to_screen_name</Text>
			<Text>{t.full_text.split("\n").join(" ")}</Text>
			<Text>Quoted</Text>
		</Box>
	);
};

interface Props {
	tweets: TweetV1[];
	onSelectTweet: (item: { value: TweetV1 }) => void;
	onHighlightTweet: (item: { value: TweetV1 }) => void;
}

export const UserTimelineSelect = ({
	tweets,
	onSelectTweet,
	onHighlightTweet,
}: Props) => {
	const items: Item<TweetV1>[] = tweets.map((t) => ({
		key: t.id_str,
		label: t.full_text,
		value: t,
	}));

	return (
		<NoRotateSelect
			items={items}
			onSelect={onSelectTweet}
			onHighlight={onHighlightTweet}
			indicatorComponent={IndicatorComponent}
			itemComponent={ItemComponent}
			limit={5}
		/>
	);
};
