import { useAtom } from "jotai";
import type { SetStateAction } from "jotai";
import type { TweetV1, ListStatusesV1Params } from "twitter-api-v2";
import type { Column, HandledResponseError } from "../types";
import {
	currentListAtom,
	listTimelineAtom,
	listTimelineCursorsAtom,
	displayTimelineAtom,
	focusedTweetAtom,
	cursorIndexAtom,
	focusIndexAtom,
} from "../store/list";
import { useCurrentColumn, useDisplayTweetsCount as useCountRoot } from ".";
import { useApi } from "./api";

export const useCurrentList = () => useAtom(currentListAtom);

export const useListTimeline = () => useAtom(listTimelineAtom);

export const useTimelineWithCache = (): [
	TweetV1[],
	(update: SetStateAction<TweetV1[]>) => void
] => {
	const [timeline, setTL] = useAtom(listTimelineAtom);
	const [currentColumn, { updateColumn }] = useCurrentColumn();

	const setTimeline = (update: SetStateAction<TweetV1[]>) => {
		setTL(update);
		if (currentColumn.type === "list") {
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
		if (currentColumn.type === "list") {
			setCursor(currentColumn.cursor);
			setFocus(currentColumn.focus);
		}
	};
	const cachePosition = () => {
		if (currentColumn.type == "list") {
			updateColumn({ ...currentColumn, cursor, focus });
		}
	};

	const states = { cursor, focus };
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

type PromiseWithErrorMessage<T> = Promise<T | HandledResponseError["message"]>;

export interface ListPaginator {
	fetch: (params: { list_id: string }) => PromiseWithErrorMessage<null>;
	fetchFuture: () => PromiseWithErrorMessage<null>;
	fetchPast: () => PromiseWithErrorMessage<null>;
}

export const useListPaginator = (): ListPaginator => {
	const api = useApi();
	const { id_str: list_id } = useCurrentList()[0];
	const { since_id, max_id } = useAtom(listTimelineCursorsAtom)[0];
	const { setCursor } = usePosition()[1];
	const setTimeline = useListTimeline()[1];

	const defaultParams: ListStatusesV1Params = {
		count: 200,
		tweet_mode: "extended",
		include_entities: true,
	};

	const fetch = async (params: { list_id: string }) => {
		const res = await api.getListTweets({ ...defaultParams, ...params });
		if (typeof res === "string") {
			return res;
		}
		if (res.length) {
			setTimeline(res);
		}
		return null;
	};
	const fetchFuture = async () => {
		const res = await api.getListTweets({
			...defaultParams,
			list_id,
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
		const res = await api.getListTweets({
			...defaultParams,
			list_id,
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

	return {
		fetch,
		fetchFuture,
		fetchPast,
	};
};

export const useMover = (): {
	prev: (update: () => void) => void;
	next: (update: () => void) => void;
	pageUp: (update: () => void) => void;
	pageDown: (update: () => void) => void;
	top: () => void;
	bottom: () => void;
} => {
	const [{ cursor, focus }, { setCursor, setFocus }] = usePosition();
	const { length } = useListTimeline()[0];
	const count = useCountRoot()[0];

	const prev = (update: () => void) => {
		if (focus === 0) {
			if (cursor === 0) {
				update();
			} else {
				setCursor((c) => c - 1);
			}
		} else {
			setFocus((f) => f - 1);
		}
	};
	const next = (update: () => void) => {
		if (focus + 1 === count) {
			if (cursor + count + 1 > length) {
				update();
			} else {
				setCursor((c) => c + 1);
			}
		} else {
			setFocus((f) => f + 1);
		}
	};
	const pageUp = (update: () => void) => {
		if (cursor + focus <= count) {
			setCursor(0);
			update();
		} else {
			setCursor(Math.max(cursor - count, 0));
		}
	};
	const pageDown = (update: () => void) => {
		if (cursor + count * 2 > length) {
			setCursor(length - count);
			update();
		} else {
			setCursor(Math.min(cursor + count, length - count - 1));
		}
	};
	const top = () => {
		if (cursor !== 0) {
			setCursor(0);
		}
	};
	const bottom = () => {
		if (cursor < length - count) {
			setCursor(length - count);
		}
	};

	return { prev, next, pageUp, pageDown, top, bottom };
};
