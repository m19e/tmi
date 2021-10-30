import { useAtom, SetStateAction } from "jotai";
import type { TwitterApi, TweetV1, ListStatusesV1Params } from "twitter-api-v2";
import type { UserConfig, HandledResponseError } from "../types";
import type { TrimmedList } from "../types/twitter";
import {
	twitterClientAtom,
	userConfigAtom,
	currentListAtom,
	listTimelineAtom,
	listTimelineCursorsAtom,
	displayTimelineAtom,
	focusedTweetAtom,
	cursorIndexAtom,
	focusIndexAtom,
	displayTweetsCountAtom,
} from "../store/v2";
import { convertTweetToDisplayable } from "../lib";
import { handleResponseError } from "../lib/helpers";

export const useUserConfig = (): [
	UserConfig | null,
	(update?: SetStateAction<UserConfig>) => void
] => useAtom(userConfigAtom);

export const useTwitterClient = (): [
	TwitterApi | null,
	(update?: SetStateAction<TwitterApi>) => void
] => useAtom(twitterClientAtom);

export const getDisplayTimeline = () => useAtom(displayTimelineAtom)[0];

export const useDisplayTweetsCount = (): [
	number,
	{ inc: () => void; dec: () => void }
] => {
	const [count, setCount] = useAtom(displayTweetsCountAtom);
	const [focus, setFocus] = useAtom(focusIndexAtom);
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

export const useCursorIndex = () => useAtom(cursorIndexAtom);

export const useFocusIndex = () => useAtom(focusIndexAtom);

export const getFocusedTweet = () => useAtom(focusedTweetAtom)[0];

export const useCurrentList = (): [
	TrimmedList,
	(update?: SetStateAction<TrimmedList>) => void
] => useAtom(currentListAtom);

export const useListTimeline = (): [
	Array<TweetV1>,
	(update?: SetStateAction<Array<TweetV1>>) => void
] => useAtom(listTimelineAtom);

type PromiseWithErrorMessage<T> = Promise<T | HandledResponseError["message"]>;

interface ListPaginator {
	tweets: Array<TweetV1>;
	fetchNewer: () => PromiseWithErrorMessage<null>;
	fetchOlder: () => PromiseWithErrorMessage<null>;
}

export const useListPaginator = (): ListPaginator => {
	const [{ v1: api }] = useAtom(twitterClientAtom);
	const [timeline, setTimeline]: [
		Array<TweetV1>,
		(update?: SetStateAction<Array<TweetV1>>) => void
	] = useAtom(listTimelineAtom);
	const [{ id_str: list_id }] = useAtom(currentListAtom);
	const [{ since_id, max_id }] = useAtom(listTimelineCursorsAtom);
	const [, setCursor] = useAtom(cursorIndexAtom);
	const defaultParams: ListStatusesV1Params = {
		count: 200,
		tweet_mode: "extended",
		include_entities: true,
	};

	const fetchNewer = async () => {
		try {
			const { tweets } = await api.listStatuses({
				...defaultParams,
				list_id,
				since_id,
			});
			if (tweets.length) {
				const converted = tweets.map(convertTweetToDisplayable);
				setCursor((prev) => prev + tweets.length);
				setTimeline((prev) => [...converted, ...prev]);
			}
			return null;
		} catch (error) {
			return handleResponseError(error, "GET", "lists/statuses").message;
		}
	};
	const fetchOlder = async () => {
		try {
			const { tweets } = await api.listStatuses({
				...defaultParams,
				list_id,
				max_id,
			});
			if (tweets.length) {
				const converted = tweets.map(convertTweetToDisplayable);
				setTimeline((prev) => [...prev, ...converted]);
			}
			return null;
		} catch (error) {
			return handleResponseError(error, "GET", "lists/statuses").message;
		}
	};

	return {
		tweets: timeline,
		fetchNewer,
		fetchOlder,
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
	const [count] = useAtom(displayTweetsCountAtom);
	const [{ length }] = useAtom(listTimelineAtom);
	const [cursor, setCursor] = useAtom(cursorIndexAtom);
	const [focus, setFocus] = useAtom(focusIndexAtom);

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
