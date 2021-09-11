import React from "react";
import { Text, Box } from "ink";
import Divider from "ink-divider";
import Loader from "./Loader";
import useDimensions from "ink-use-stdout-dimensions";
import { Tweet } from "../types/twitter";
import { getDisplayTimeAgo } from "../lib";

type Props = {
	tweet: Tweet;
	isFocused: boolean;
	inFav: boolean;
	inRT: boolean;
};

const TweetItem = ({ tweet, isFocused, inFav, inRT }: Props) => {
	const t = tweet.retweeted_status ?? tweet;
	const ago = getDisplayTimeAgo(t.created_at);

	const [cols] = useDimensions();

	return (
		<>
			<Box flexDirection="column" paddingLeft={isFocused ? 4 : 0}>
				{tweet.retweeted_status && (
					<Text dimColor>
						🔄 {tweet.user.name}
						{tweet.user.protected && "🔒"} RT
					</Text>
				)}
				<Text>
					<Text color={tweet.retweeted_status ? "greenBright" : "#00acee"}>
						{`${t.user.name} @${t.user.screen_name} `}
						{t.user.protected && "🔒 "}
					</Text>
					<Text dimColor>{ago}</Text>
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
				<Box height={1}>
					{isFocused && (
						<>
							<Box>
								<Text>{t.retweet_count ? t.retweet_count + " " : ""}</Text>
								<Text color={t.retweeted ? "green" : "white"}>RT</Text>
								<Box marginX={1}>
									<Loader loading={inRT} namedColor="green" />
								</Box>
							</Box>
							<Box>
								<Text>{t.favorite_count ? t.favorite_count + " " : ""}</Text>
								<Text color={t.favorited ? "yellow" : "white"}>fav</Text>
								<Box marginX={1}>
									<Loader loading={inFav} namedColor="yellow" />
								</Box>
							</Box>
						</>
					)}
				</Box>
			</Box>
			<Divider
				width={cols}
				padding={0}
				dividerColor={isFocused ? "white" : "gray"}
			/>
		</>
	);
};

const Quoted = ({ tweet }: { tweet: Tweet | null }) => {
	if (!tweet) return null;
	const ago = getDisplayTimeAgo(tweet.created_at);

	return (
		<Box flexDirection="column" borderStyle="round" borderColor="gray">
			<Text>
				<Text color="greenBright">
					{`${tweet.user.name} @${tweet.user.screen_name} `}
					{tweet.user.protected && "🔒 "}
				</Text>
				<Text dimColor>{ago}</Text>
			</Text>
			<Text>
				{tweet.full_text}
				{tweet.entities.media && <Text dimColor> (with Media)</Text>}
			</Text>
		</Box>
	);
};

export default TweetItem;
