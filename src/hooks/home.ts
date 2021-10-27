import { useAtom } from "jotai";
import type { SetStateAction } from "jotai";
import type { Column } from "../types";
import { displayTweetsCountAtom } from "../store/v2";
import {
	homeTimelineAtom,
	displayHomeTimelineAtom,
	homeCursorIndexAtom,
	homeFocusIndexAtom,
	homeFocusedTweetAtom,
} from "../store/home";
import { useCurrentColumn } from "../hooks";

export const useHomeTimeline = () => useAtom(homeTimelineAtom);

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
