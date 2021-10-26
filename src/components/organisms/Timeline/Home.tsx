import React, { useState, useEffect } from "react";
import { atom, useAtom } from "jotai";
import type { SetStateAction } from "jotai";
import { Box, Text, useInput } from "ink";
import type { TweetV1 } from "twitter-api-v2";
import type { Column } from "../../../types";
import { displayTweetsCountAtom } from "../../../store/v2";
import { useCurrentColumn, useError } from "../../../hooks";
import { useTwitterApi } from "../../../hooks/v2";

const homeTimelineAtom = atom<Array<TweetV1>>([]);
const cursorIndexAtom = atom(0);
const focusIndexAtom = atom(0);
const displayTimelineAtom = atom<TweetV1[]>((get) => {
	const cursor = get(cursorIndexAtom);
	const count = get(displayTweetsCountAtom);
	return get(homeTimelineAtom).slice(cursor, cursor + count);
});

const useHomeTimeline = () => useAtom(homeTimelineAtom);
const usePosition = (): [
	{ cursor: number; focus: number },
	{
		setCursor: (update?: SetStateAction<number>) => void | Promise<void>;
		setFocus: (update?: SetStateAction<number>) => void | Promise<void>;
		loadPosition: () => void;
	}
] => {
	const [column, { updateColumn }] = useCurrentColumn();
	const [cursor, setC] = useAtom(cursorIndexAtom);
	const [focus, setF] = useAtom(focusIndexAtom);

	const cachePosition = (update?: SetStateAction<Column>) => {
		if (typeof update === "function") {
			const newColumn = update(column);
			updateColumn(newColumn);
		} else {
			updateColumn(update);
		}
	};

	const setCursor = (update?: SetStateAction<number>) => {
		if (typeof update === "function") {
			const newC = update(cursor);
			cachePosition((prev) => ({ ...prev, cursor: newC }));
			setC(newC);
		} else {
			cachePosition((prev) => ({ ...prev, cursor: update }));
			setC(update);
		}
	};
	const setFocus = (update?: SetStateAction<number>) => {
		if (typeof update === "function") {
			const newF = update(focus);
			cachePosition((prev) => ({ ...prev, focus: newF }));
			setF(newF);
		} else {
			cachePosition((prev) => ({ ...prev, focus: update }));
			setF(update);
		}
	};
	const loadPosition = () => {
		setC(column.cursor);
		setF(column.focus);
	};

	const states = {
		cursor,
		focus,
	};
	const actions = {
		setCursor,
		setFocus,
		loadPosition,
	};
	return [states, actions];
};

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
	}, [column.name]);

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
