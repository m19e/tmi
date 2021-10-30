import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import type { SetStateAction } from "jotai";
import type { TweetV1TimelineParams } from "twitter-api-v2";
import type { Column } from "../types";
import { convertTweetToDisplayable } from "../lib";
import { displayTweetsCountAtom } from "../store/v2";
import {
	homeTimelineAtom,
	displayHomeTimelineAtom,
	homeCursorIndexAtom,
	homeFocusIndexAtom,
	homeFocusedTweetAtom,
	homeTimelineCursorsAtom,
} from "../store/home";
import { useCurrentColumn } from "../hooks";
import { useApi } from "./api";

export const useHomeTimeline = () => useAtom(homeTimelineAtom);

export const usePosition = (): [
	{ cursor: number; focus: number },
	{
		setCursor: (update: SetStateAction<number>) => void | Promise<void>;
		setFocus: (update: SetStateAction<number>) => void | Promise<void>;
		loadPosition: () => void;
	}
] => {
	const [column, { updateColumn }] = useCurrentColumn();
	const [cursor, setC] = useAtom(homeCursorIndexAtom);
	const [focus, setF] = useAtom(homeFocusIndexAtom);

	const _cachePosition = (update: SetStateAction<Column>) => {
		if (typeof update === "function") {
			const newColumn = update(column);
			updateColumn(newColumn);
		} else {
			updateColumn(update);
		}
	};

	const setCursor = (update: SetStateAction<number>) => {
		if (typeof update === "function") {
			const newC = update(cursor);
			_cachePosition((prev) => ({ ...prev, cursor: newC }));
			setC(newC);
		} else {
			_cachePosition((prev) => ({ ...prev, cursor: update }));
			setC(update);
		}
	};
	const setFocus = (update: SetStateAction<number>) => {
		if (typeof update === "function") {
			const newF = update(focus);
			_cachePosition((prev) => ({ ...prev, focus: newF }));
			setF(newF);
		} else {
			_cachePosition((prev) => ({ ...prev, focus: update }));
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

export const useHomePaginator = () => {
	const api = useApi();
	const [, setTimeline] = useHomeTimeline();
	const [, { setCursor }] = usePosition();
	const [{ since_id, max_id }] = useAtom(homeTimelineCursorsAtom);

	const [fetchableTime, setFetchableTime] = useState(0);
	const updateFetchableTime = (now: number) =>
		setFetchableTime(now + 60 * 1000);

	const defaultParams: TweetV1TimelineParams = {
		count: 200,
		tweet_mode: "extended",
		include_entities: true,
	};

	const _fetchWithLimit = async (fetcher: () => Promise<string | null>) => {
		const now = Date.now();
		if (now < fetchableTime) {
			return `Fetch limit will reset after ${Math.floor(
				(fetchableTime - now) / 1000
			)} seconds`;
		}
		updateFetchableTime(now);

		return await fetcher();
	};

	const fetch = async () =>
		await _fetchWithLimit(async () => {
			const res = await api.getHomeTweets(defaultParams);
			if (typeof res === "string") {
				return res;
			}
			if (res.length) {
				setTimeline(res);
			}
			return null;
		});
	const fetchFuture = async () =>
		await _fetchWithLimit(async () => {
			const res = await api.getHomeTweets({
				...defaultParams,
				since_id,
			});
			if (typeof res === "string") {
				return res;
			}
			if (res.length) {
				const converted = res.map(convertTweetToDisplayable);
				setCursor((prev) => prev + converted.length);
				setTimeline((prev) => [...converted, ...prev]);
			}
			return null;
		});
	const fetchPast = async () =>
		await _fetchWithLimit(async () => {
			const res = await api.getHomeTweets({
				...defaultParams,
				max_id,
			});
			if (typeof res === "string") {
				return res;
			}
			if (res.length) {
				const converted = res.map(convertTweetToDisplayable);
				setTimeline((prev) => [...prev, ...converted]);
			}
		});

	return { fetch, fetchFuture, fetchPast };
};

export const useDisplayTweetsCount = (): [
	number,
	{ inc: () => void; dec: () => void }
] => {
	const [count, setCount] = useAtom(displayTweetsCountAtom);
	const [{ focus }, { setFocus }] = usePosition();
	const inc = () => {
		if (count < 20) setCount((c) => c + 1);
	};
	const dec = () => {
		if (count > 1) {
			if (count - 1 === focus) setFocus((f) => f - 1);
			setCount((c) => c - 1);
		}
	};
	return [count, { inc, dec }];
};

export const useMover = () => {
	const [count] = useDisplayTweetsCount();
	const [{ length }] = useHomeTimeline();
	const [{ cursor, focus }, { setCursor, setFocus }] = usePosition();

	const mover = {
		prev: (update: () => void) => {
			if (focus === 0) {
				if (cursor === 0) {
					update();
				} else {
					setCursor((c) => c - 1);
				}
			} else {
				setFocus((f) => f - 1);
			}
		},
		next: (update: () => void) => {
			if (focus + 1 === count) {
				if (cursor + count + 1 > length) {
					update();
				} else {
					setCursor((c) => c + 1);
				}
			} else {
				setFocus((f) => f + 1);
			}
		},
		pageUp: (update: () => void) => {
			if (cursor + focus <= count) {
				setCursor(0);
				update();
			} else {
				setCursor(Math.max(cursor - count, 0));
			}
		},
		pageDown: (update: () => void) => {
			if (cursor + count * 2 > length) {
				setCursor(length - count);
				update();
			} else {
				setCursor(Math.min(cursor + count, length - count - 1));
			}
		},
		top: () => {
			if (cursor !== 0) {
				setCursor(0);
			}
		},
		bottom: () => {
			if (cursor < length - count) {
				setCursor(length - count);
			}
		},
	};

	return mover;
};

export const getDisplayTimeline = () => useAtom(displayHomeTimelineAtom)[0];
export const getFocusedTweet = () => useAtom(homeFocusedTweetAtom)[0];
