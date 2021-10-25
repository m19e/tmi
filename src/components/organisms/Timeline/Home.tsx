import React, { useEffect } from "react";
import { Box, Text } from "ink";
import { useError } from "../../../hooks";
import { useTwitterApi } from "../../../hooks/v2";
import { useHomeTimeline } from "../../../hooks/home";

export const HomeTimeline = () => {
	const api = useTwitterApi();
	const [timeline, setTimeline] = useHomeTimeline();

	useEffect(() => {
		const init = async () => {
			const res = await api.getHomeTweets({
				count: 200,
				include_entities: true,
			});
			if (typeof res === "string") {
				// setError(res)
			} else {
				setTimeline(res);
			}
		};
		if (!timeline.length) {
			init();
		}
	}, []);

	if (!timeline.length) {
		return <Text>Home Timeline is Empty.</Text>;
	}

	return (
		<Box flexDirection="column">
			{timeline.map((tweet) => (
				<Text>
					{tweet.user.screen_name}: {tweet.full_text}
				</Text>
			))}
		</Box>
	);
};
