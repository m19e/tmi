import React, { useState, useEffect } from "react";
import { atom, useAtom } from "jotai";
import type { SetStateAction } from "jotai";
import { Box, Text, useInput } from "ink";
import type { TweetV1 } from "twitter-api-v2";
import type { Column } from "../../../types";
import { displayTweetsCountAtom } from "../../../store/v2";
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
		return <Text>Home Timeline is Empty.</Text>;
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
