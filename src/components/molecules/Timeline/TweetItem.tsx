import type { VFC } from "react";
import { Box, Text } from "ink";
import type { TweetV1 } from "twitter-api-v2";
import stc from "string-to-color";
import figures from "../../../lib/sindresorhus/figures";
import { getDisplayTimeAgo, convertTweetToDisplayable } from "../../../lib";
import Quoted from "../Quoted";
import { Space } from "../../atoms/Space";

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

export const TweetItem: VFC<{ tweet: TweetV1 }> = ({ tweet }) => {
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
