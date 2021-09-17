import React from "react";
import { Text, Box } from "ink";
import Divider from "ink-divider";
import useDimensions from "ink-use-stdout-dimensions";
import stc from "string-to-color";
import { Tweet } from "../types/twitter";
import { getDisplayTimeAgo } from "../lib";
import Loader from "./Loader";
import Quoted from "./Quoted";

type Props = {
	tweet: Tweet;
	inFav: boolean;
	inRT: boolean;
	isFocused?: boolean;
};

const TweetItem = ({ tweet, isFocused = true, inFav, inRT }: Props) => {
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

const Borderless = ({ tweet, isFocused = true, inFav, inRT }: Props) => {
	const t = tweet.retweeted_status ?? tweet;
	const ago = getDisplayTimeAgo(t.created_at);
	const generatedColor = stc(t.user.screen_name);

	return (
		<Box marginBottom={1}>
			<Box width={2} height={2} flexDirection="column">
				{isFocused && (
					<>
						<Text color="#00acee">█</Text>
						<Text color="#00acee">█</Text>
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
								<Loader loading={inFav} namedColor="yellow" />{" "}
							</>
						) : (
							<>{t.favorited ? "█ " : ""}</>
						)}
						{t.favorite_count ? `${t.favorite_count}fav ` : " "}
					</Text>
					<Text color="green">
						{inRT ? (
							<>
								<Loader loading={inRT} namedColor="green" />{" "}
							</>
						) : (
							<>{t.retweeted ? "█ " : ""}</>
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

export default Borderless;
