import React from "react";
import { Text, Box } from "ink";
import stc from "string-to-color";
import type { Tweet } from "../../types/twitter";
import { getDisplayTimeAgo } from "../../lib";
import figures from "../../lib/sindresorhus/figures";

const Quoted = ({ tweet }: { tweet: Tweet | null }) => {
	if (!tweet) return null;
	const ago = getDisplayTimeAgo(tweet.created_at);
	const generatedColor = stc(tweet.user.screen_name);

	return (
		<Box marginTop={1} marginLeft={2}>
			<Box width={2} flexDirection="column">
				<Text color="greenBright">{figures.squareLeft}</Text>
				<Text color="greenBright">{figures.squareLeft}</Text>
			</Box>
			<Box flexGrow={1} flexDirection="column">
				<Text>
					<Text bold color={generatedColor}>
						<>{tweet.user.name} </>
					</Text>
					<>
						(@{tweet.user.screen_name}) {tweet.user.protected && "🔒 "}
					</>
					<>[{ago}] </>
				</Text>
				<Text>
					{tweet.full_text}
					{tweet.entities.media && <Text dimColor> (with Media)</Text>}
				</Text>
			</Box>
		</Box>
	);
};

export default Quoted;
