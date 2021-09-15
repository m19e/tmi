import React from "react";
import { Text, Box } from "ink";
import stc from "string-to-color";
import { Tweet } from "../types/twitter";
import { getDisplayTimeAgo } from "../lib";

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

const Borderless = ({ tweet }: { tweet: Tweet | null }) => {
	if (!tweet) return null;
	const ago = getDisplayTimeAgo(tweet.created_at);
	const generatedColor = stc(tweet.user.screen_name);

	return (
		<Box marginTop={1} marginLeft={2}>
			<Box width={2} flexDirection="column">
				<Text color="greenBright">▌</Text>
				<Text color="greenBright">▌</Text>
			</Box>
			<Box flexGrow={1} flexDirection="column">
				<Text>
					<Text bold color={generatedColor}>
						{tweet.user.name}{" "}
					</Text>
					<Text>
						(@{tweet.user.screen_name}) {tweet.user.protected && "🔒 "}
					</Text>
					<Text>[{ago}] </Text>
				</Text>
				<Text>
					{tweet.full_text}
					{tweet.entities.media && <Text dimColor> (with Media)</Text>}
				</Text>
			</Box>
		</Box>
	);
};

export default Borderless;
