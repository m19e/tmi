import React from "react";
import { Text, Box } from "ink";
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

export default Quoted;
