import React from "react";
import type { FC } from "react";
import { Text, Box } from "ink";
import stc from "string-to-color";
import type { TweetV1 } from "twitter-api-v2";
import { getDisplayTimeAgo } from "../../lib";
import figures from "../../lib/sindresorhus/figures";
import { Space } from "../atoms/Space";

interface Props {
	tweet: TweetV1;
}

const Quoted: FC<Props> = ({ tweet }) => {
	if (!tweet) return null;
	const ago = getDisplayTimeAgo(tweet.created_at);
	const generatedColor = stc(tweet.user.screen_name);

	return (
		<Box marginTop={1} marginLeft={2}>
			<Box width={2} height={2} flexDirection="column">
				<Text color="greenBright">{figures.squareLeft}</Text>
				<Text color="greenBright">{figures.squareLeft}</Text>
			</Box>
			<Box flexGrow={1} flexDirection="column">
				<Text>
					<Text bold color={generatedColor}>
						{tweet.user.name}
					</Text>
					<Space />
					<Text>(@{tweet.user.screen_name})</Text>
					<Space />
					{tweet.user.protected && (
						<Text>
							🔒
							<Space />
						</Text>
					)}
					<Text>[{ago}]</Text>
					<Space />
				</Text>
				<Text>
					{tweet.full_text}
					{tweet.entities.media && (
						<Text dimColor>
							<Space />
							(with Media)
						</Text>
					)}
				</Text>
			</Box>
		</Box>
	);
};

export default Quoted;
