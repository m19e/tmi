import { useAtom, SetStateAction } from "jotai";
import type Twitter from "twitter-lite";
import {
	userIdAtom,
	clientAtom,
	timelineAtom,
	displayTimelineAtom,
	focusedTweetAtom,
	cursorIndexAtom,
	focusIndexAtom,
	displayTweetsCountAtom,
	focusedPositionAtom,
	requestResultAtom,
	errorAtom,
	hintAtom,
} from "../store";
import { TimelineHintKey } from "../types";
import { hintMap } from "../consts";

export const useUserId = () => useAtom(userIdAtom);

export const useClient = (): [
	Twitter | null,
	(update?: SetStateAction<Twitter | null>) => void
] => useAtom(clientAtom);

export const useTimeline = () => useAtom(timelineAtom);

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

export const getFocusedPosition = () => useAtom(focusedPositionAtom)[0];

export const useMover = (): {
	prev: (update: () => void) => void;
	next: (update: () => void) => void;
	pageUp: (update: () => void) => void;
	pageDown: (update: () => void) => void;
	top: () => void;
	bottom: () => void;
} => {
	const [count] = useAtom(displayTweetsCountAtom);
	const [{ length }] = useAtom(timelineAtom);
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

export const useRequestResult = (): [
	string | undefined,
	(update: string) => void
] => {
	const [requestResult, setR]: [
		string | undefined,
		(update?: SetStateAction<string | undefined>) => void | Promise<void>
	] = useAtom(requestResultAtom);
	const [error, setError]: [
		string | undefined,
		(update?: SetStateAction<string | undefined>) => void | Promise<void>
	] = useAtom(errorAtom);

	const setRequestResult = (r: string) => {
		if (error) setError(undefined);
		setR(r);
	};

	return [requestResult, setRequestResult];
};

export const useError = (): [string | undefined, (update: string) => void] => {
	const [error, setE]: [
		string | undefined,
		(update?: SetStateAction<string | undefined>) => void | Promise<void>
	] = useAtom(errorAtom);
	const [requestResult, setRequestResult]: [
		string | undefined,
		(update?: SetStateAction<string | undefined>) => void | Promise<void>
	] = useAtom(requestResultAtom);

	const setError = (e: string) => {
		if (requestResult) setRequestResult(undefined);
		setE(e);
	};

	return [error, setError];
};

export const useHint = (): [
	string | undefined,
	(key: TimelineHintKey) => void
] => {
	const [hint, setHint]: [
		string | undefined,
		(update?: SetStateAction<string | undefined>) => void | Promise<void>
	] = useAtom(hintAtom);

	const setHintKey = (key: TimelineHintKey) => setHint(hintMap.get(key));

	return [hint, setHintKey];
};
