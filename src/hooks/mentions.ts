import { useAtom } from "jotai";
import type { SetStateAction } from "jotai";
import type { TweetV1TimelineParams } from "twitter-api-v2";
import {
	displayTimelineAtom,
	focusedTweetAtom,
	pagingCursorsAtom,
	timelineAtom,
	cursorIndexAtom,
	focusIndexAtom,
} from "../store/mentions";
import { useDisplayTweetsCount as useRootCount } from ".";
import { useApi } from "./api";

export const getDisplayTimeline = () => useAtom(displayTimelineAtom)[0];

export const getFocusedTweet = () => useAtom(focusedTweetAtom)[0];

export const useTimeline = () => useAtom(timelineAtom);

export const usePosition = (): [
	{ cursor: number; focus: number },
	{
		setCursor: (update?: SetStateAction<number>) => void | Promise<void>;
		setFocus: (update?: SetStateAction<number>) => void | Promise<void>;
	}
] => {
	const [cursor, setCursor] = useAtom(cursorIndexAtom);
	const [focus, setFocus] = useAtom(focusIndexAtom);

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

export const useDisplayTweetsCount = (): [
	number,
	{ inc: () => void; dec: () => void }
] => {
	const [{ focus }, { setFocus }] = usePosition();
	const [count, setCount] = useRootCount();

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
	const { length } = useTimeline()[0];

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

export const useMentionsPaginator = () => {
	const api = useApi();
	const { since_id, max_id } = useAtom(pagingCursorsAtom)[0];
	const setTimeline = useTimeline()[1];
	const { setCursor } = usePosition()[1];

	const defaultParams: TweetV1TimelineParams = {
		count: 200,
		tweet_mode: "extended",
		include_entities: true,
	};

	const fetch = async () => {
		const res = await api.getMentionTweets(defaultParams);
		if (typeof res === "string") {
			return res;
		}
		if (res.length) {
			setTimeline(res);
		}
		return null;
	};
	const fetchFuture = async () => {
		const res = await api.getMentionTweets({ ...defaultParams, since_id });
		if (typeof res === "string") {
			return res;
		}
		if (res.length) {
			setCursor((prev) => prev + res.length);
			setTimeline((prev) => [...res, ...prev]);
		}
		return null;
	};
	const fetchPast = async () => {
		const res = await api.getMentionTweets({ ...defaultParams, max_id });
		if (typeof res === "string") {
			return res;
		}
		if (res.length) {
			setTimeline((prev) => [...prev, ...res]);
		}
		return null;
	};

	return { fetch, fetchFuture, fetchPast };
};
