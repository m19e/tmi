import { useState } from "react";
import { useAtom } from "jotai";
import type { SetStateAction } from "jotai";
import type { TweetV1 } from "twitter-api-v2";
import type { ReturnHookTuple } from "../types";
import type { TweetV1SearchParams } from "../types/twitter";
import {
	timelineAtom,
	displayTimelineAtom,
	cursorIndexAtom,
	focusIndexAtom,
	focusedTweetAtom,
	pagingCursorsAtom,
} from "../store/search";
import { useCurrentColumn, useDisplayTweetsCount as useRootCount } from ".";
import { useApi } from "./api";

export const useTimeline = () => useAtom(timelineAtom);

export const useTimelineWithCache = (): ReturnHookTuple<TweetV1[]> => {
	const [timeline, setTL] = useAtom(timelineAtom);
	const [currentColumn, { updateColumn }] = useCurrentColumn();

	const setTimeline = (update: SetStateAction<TweetV1[]>) => {
		setTL(update);
		if (currentColumn.type === "search") {
			const newTL = typeof update === "function" ? update(timeline) : update;
			updateColumn({ ...currentColumn, timeline: newTL });
		}
	};

	return [timeline, setTimeline];
};

export const getDisplayTimeline = () => useAtom(displayTimelineAtom)[0];

export const getFocusedTweet = () => useAtom(focusedTweetAtom)[0];

interface PositionActions {
	setCursor: (update: SetStateAction<number>) => void | Promise<void>;
	setFocus: (update: SetStateAction<number>) => void | Promise<void>;
	loadPosition: () => void;
	cachePosition: () => void;
}

export const usePosition = (): [
	{ cursor: number; focus: number },
	PositionActions
] => {
	const [currentColumn, { updateColumn }] = useCurrentColumn();
	const [cursor, setCursor] = useAtom(cursorIndexAtom);
	const [focus, setFocus] = useAtom(focusIndexAtom);

	const loadPosition = () => {
		if (currentColumn.type === "search") {
			setCursor(currentColumn.cursor);
			setFocus(currentColumn.focus);
		}
	};
	const cachePosition = () => {
		if (currentColumn.type == "search") {
			updateColumn({ ...currentColumn, cursor, focus });
		}
	};

	const states = {
		cursor,
		focus,
	};
	const actions = {
		setCursor,
		setFocus,
		loadPosition,
		cachePosition,
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

export const useSearchPaginator = () => {
	const api = useApi();
	const [column, { updateColumn }] = useCurrentColumn();
	const { since_id, max_id } = useAtom(pagingCursorsAtom)[0];
	const { setCursor } = usePosition()[1];
	const setTimeline = useTimelineWithCache()[1];

	const [cachedParams, setCachedParams] = useState<TweetV1SearchParams>({
		q: "",
		result_type: "recent",
		count: 100,
		tweet_mode: "extended",
		include_entities: true,
	});

	const fetch = async (params: Pick<TweetV1SearchParams, "q">) => {
		const newParams = { ...cachedParams, q: `${params.q} -RT` };
		setCachedParams(newParams);
		if (column.type === "search") {
			const newColumn: typeof column = { ...column, query: params.q };
			updateColumn(newColumn);
		}
		const res = await api.search(newParams);
		if (typeof res === "string") {
			return res;
		}
		if (res.length) {
			setTimeline(res);
		}
		return null;
	};
	const fetchFuture = async () => {
		const res = await api.search({
			...cachedParams,
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
	};
	const fetchPast = async () => {
		const res = await api.search({
			...cachedParams,
			max_id,
		});
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

export const useSingleSearchPaginator = () => {
	const api = useApi();
	const { since_id, max_id } = useAtom(pagingCursorsAtom)[0];
	const setTimeline = useTimeline()[1];
	const { setCursor } = usePosition()[1];

	const [cachedParams, setCachedParams] = useState<TweetV1SearchParams>({
		q: "",
		result_type: "recent",
		count: 100,
		tweet_mode: "extended",
		include_entities: true,
	});

	const fetch = async (params: Pick<TweetV1SearchParams, "q">) => {
		const newParams = { ...cachedParams, q: `${params.q} -RT` };
		setCachedParams(newParams);
		const res = await api.search(newParams);
		if (typeof res === "string") {
			return res;
		}
		if (res.length) {
			setTimeline(res);
		}
		return null;
	};
	const fetchFuture = async () => {
		const res = await api.search({
			...cachedParams,
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
	};
	const fetchPast = async () => {
		const res = await api.search({
			...cachedParams,
			max_id,
		});
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
