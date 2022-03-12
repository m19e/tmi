import type { VFC } from "react";
import type { TweetV1 } from "twitter-api-v2";
import stc from "string-to-color";
import { Box, Text } from "ink";
import figures from "../../lib/sindresorhus/figures";

import { getDisplayTimeAgo, convertTweetToDisplayable } from "../../lib";
import { NoRotateSelect } from "./SelectInput";
import type { Item } from "./SelectInput";
import Quoted from "./Quoted";
import { Space } from "../atoms/Space";

interface IndicatorProps {
	isSelected?: boolean;
}

const TweetIndicator: VFC<IndicatorProps> = ({ isSelected = false }) => (
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

const RetweetedLabel: VFC<{ tweet: TweetV1 }> = ({ tweet }) => {
	if (tweet.retweeted_status) {
		return (
			<Text>
				(<Text bold>@{tweet.user.screen_name}</Text> RT)
				<Space />
			</Text>
		);
	}
	return null;
};

interface ItemProps {
	isSelected?: boolean;
	label: string;
	value: TweetV1;
}

const TweetItemWrapper: VFC<ItemProps> = ({ value }) => {
	return <TweetItem tweet={value} />;
};

const TweetItem: VFC<{ tweet: TweetV1 }> = ({ tweet }) => {
	const converted = convertTweetToDisplayable(tweet);
	const t = converted.retweeted_status ?? converted;
	const ago = getDisplayTimeAgo(t.created_at);
	const generatedColor = stc(t.user.screen_name);

	return (
		<Box flexDirection="column" flexGrow={1} marginBottom={1}>
			<Text>
				<Text bold color={generatedColor}>
					{t.user.name}
				</Text>
				<Space />
				<Text>(@{t.user.screen_name})</Text>
				<Space />
				{t.user.protected && (
					<Text>
						🔒
						<Space />
					</Text>
				)}
				<Text>[{ago}]</Text>
				<Space />
				<RetweetedLabel tweet={converted} />
				<Text color="yellow">
					{t.favorited && (
						<Text>
							{figures.square}
							<Space />
						</Text>
					)}
					{!!t.favorite_count && <Text>{t.favorite_count}fav</Text>}
					<Space />
				</Text>
				<Text color="green">
					{t.retweeted && (
						<Text>
							{figures.square}
							<Space />
						</Text>
					)}
					{!!t.retweet_count && <Text>{t.retweet_count}RT</Text>}
					<Space />
				</Text>
			</Text>
			{!!t.in_reply_to_screen_name && (
				<Text>
					<Text dimColor>Replying to </Text>
					<Text color="#00acee">@{t.in_reply_to_screen_name}</Text>
				</Text>
			)}
			<Text>
				{t.full_text}
				{t.entities.media && (
					<Text dimColor>
						<Space />
						(with Media)
					</Text>
				)}
			</Text>
			<Quoted tweet={t.quoted_status} />
		</Box>
	);
};

const TweetSelected: VFC<ItemProps> = ({ value: tweet }) => {
	return (
		<Box>
			<TweetIndicator isSelected={true} />
			<TweetItem tweet={tweet} />
		</Box>
	);
};

interface Props {
	tweets: TweetV1[];
	onSelectTweet: (item: { value: TweetV1 }) => void;
	onHighlightTweet: (item: { value: TweetV1 }) => void;
	limit: number;
}

export const TimelineSelect = ({
	tweets,
	onSelectTweet,
	onHighlightTweet,
	limit,
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
			indicatorComponent={TweetIndicator}
			itemComponent={TweetItemWrapper}
			selectedComponent={TweetSelected}
			limit={limit}
		/>
	);
};
