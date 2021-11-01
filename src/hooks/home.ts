import { useState } from "react";
import { useAtom } from "jotai";
import type { SetStateAction } from "jotai";
import type { TweetV1TimelineParams } from "twitter-api-v2";
import {
	homeTimelineAtom,
	displayHomeTimelineAtom,
	homeCursorIndexAtom,
	homeFocusIndexAtom,
	homeFocusedTweetAtom,
	homeTimelineCursorsAtom,
} from "../store/home";
import { useDisplayTweetsCount as useCountRoot } from ".";
import { useApi } from "./api";

export const useHomeTimeline = () => useAtom(homeTimelineAtom);

export const getDisplayTimeline = () => useAtom(displayHomeTimelineAtom)[0];

export const getFocusedTweet = () => useAtom(homeFocusedTweetAtom)[0];

interface PositionActions {
	setCursor: (update: SetStateAction<number>) => void | Promise<void>;
	setFocus: (update: SetStateAction<number>) => void | Promise<void>;
}

export const usePosition = (): [
	{ cursor: number; focus: number },
	PositionActions
] => {
	const [cursor, setC] = useAtom(homeCursorIndexAtom);
	const [focus, setF] = useAtom(homeFocusIndexAtom);

	const setCursor = (update: SetStateAction<number>) => {
		if (typeof update === "function") {
			const newC = update(cursor);
			setC(newC);
		} else {
			setC(update);
		}
	};
	const setFocus = (update: SetStateAction<number>) => {
		if (typeof update === "function") {
			const newF = update(focus);
			setF(newF);
		} else {
			setF(update);
		}
	};

	const states = {
		cursor,
		focus,
	};
	const actions = {
		setCursor,
		setFocus,
	};

	return [states, actions];
};

export const useHomePaginator = () => {
	const api = useApi();
	const { since_id, max_id } = useAtom(homeTimelineCursorsAtom)[0];
	const setTimeline = useHomeTimeline()[1];
	const { setCursor } = usePosition()[1];

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
				setCursor((prev) => prev + res.length);
				setTimeline((prev) => [...res, ...prev]);
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
				setTimeline((prev) => [...prev, ...res]);
			}
			return null;
		});

	return { fetch, fetchFuture, fetchPast };
};

export const useDisplayTweetsCount = (): [
	number,
	{ inc: () => void; dec: () => void }
] => {
	const [{ focus }, { setFocus }] = usePosition();
	const [count, setCount] = useCountRoot();

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
	const [{ cursor, focus }, { setCursor, setFocus }] = usePosition();
	const count = useDisplayTweetsCount()[0];
	const { length } = useHomeTimeline()[0];

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
