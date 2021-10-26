import React, { useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useCurrentColumn, useError } from "../../../hooks";
import { useTwitterApi } from "../../../hooks/v2";
import { useHomeTimeline, usePosition } from "../../../hooks/home";

export const HomeTimeline = () => {
	const api = useTwitterApi();
	const [column] = useCurrentColumn();
	const [timeline, setTimeline] = useHomeTimeline();
	const [{ cursor, focus }, { setCursor, setFocus, loadPosition }] =
		usePosition();

	useEffect(() => {
		if (column.type === "home") {
			if (!timeline.length) {
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
				init();
			} else {
				loadPosition();
			}
		}
	}, [column.type]);

	useInput((input, key) => {
		if (key.upArrow) {
			setCursor((prev) => prev - 1);
		}
		if (key.downArrow) {
			setCursor((prev) => prev + 1);
		}
	}, {});

	if (!timeline.length) {
		return <Text>Loading...</Text>;
	}
	return (
		<Box flexDirection="column">
			<Text>
				current cursor:{cursor} focus:{focus}
			</Text>
			{/* {timeline.map((tweet) => (
				<Text>
					{tweet.user.screen_name}: {tweet.full_text}
				</Text>
			))} */}
		</Box>
	);
};
