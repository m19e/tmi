import React from "react";
import { Text, Box } from "ink";
import stc from "string-to-color";
import figures from "../../lib/sindresorhus/figures";
import { Tweet } from "../../types/twitter";
import { getDisplayTimeAgo } from "../../lib";
import Loader from "../molecules/Loader";
import Quoted from "../Quoted";

type Props = {
	tweet: Tweet;
	inFav: boolean;
	inRT: boolean;
	isFocused?: boolean;
};

const TweetItem = ({ tweet, isFocused = true, inFav, inRT }: Props) => {
	const t = tweet.retweeted_status ?? tweet;
	const ago = getDisplayTimeAgo(t.created_at);
	const generatedColor = stc(t.user.screen_name);

	return (
		<Box marginBottom={1}>
			<Box width={2} height={2} flexDirection="column">
				{isFocused && (
					<>
						<Text color="#00acee">{figures.square}</Text>
						<Text color="#00acee">{figures.square}</Text>
					</>
				)}
			</Box>
			<Box flexDirection="column" flexGrow={1}>
				<Text>
					<Text bold color={generatedColor}>
						{t.user.name}{" "}
					</Text>
					<Text>
						(@{t.user.screen_name}) {t.user.protected && "🔒 "}
					</Text>
					<Text>[{ago}] </Text>
					{tweet.retweeted_status && (
						<Text>
							(<Text bold>@{tweet.user.screen_name}</Text> RT){" "}
						</Text>
					)}
					<Text color="yellow">
						{inFav ? (
							<>
								<Loader loading={inFav} color="yellow" />{" "}
							</>
						) : (
							<>{t.favorited ? `${figures.square} ` : ""}</>
						)}
						{t.favorite_count ? `${t.favorite_count}fav ` : " "}
					</Text>
					<Text color="green">
						{inRT ? (
							<>
								<Loader loading={inRT} color="green" />{" "}
							</>
						) : (
							<>{t.retweeted ? `${figures.square} ` : ""}</>
						)}
						{t.retweet_count ? `${t.retweet_count}RT ` : " "}
					</Text>
				</Text>
				{t.in_reply_to_screen_name && (
					<Text>
						<Text dimColor>Replying to </Text>
						<Text color="#00acee">@{t.in_reply_to_screen_name}</Text>
					</Text>
				)}
				<Text>
					{t.full_text}
					{t.entities.media && <Text dimColor> (with Media)</Text>}
				</Text>
				<Quoted tweet={t.quoted_status} />
			</Box>
		</Box>
	);
};

export default TweetItem;
