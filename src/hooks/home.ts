import { useAtom } from "jotai";
import type { SetStateAction } from "jotai";
import type { Column } from "../types";
import {
	homeTimelineAtom,
	displayHomeTimelineAtom,
	homeCursorIndexAtom,
	homeFocusIndexAtom,
	homeFocusedTweetAtom,
} from "../store/home";
import { useCurrentColumn } from "../hooks";

export const useHomeTimeline = () => useAtom(homeTimelineAtom);

export const getDisplayTimeline = () => useAtom(displayHomeTimelineAtom)[0];

export const getFocusedTweet = () => useAtom(homeFocusedTweetAtom)[0];

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

	const cachePosition = (update: SetStateAction<Column>) => {
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
			cachePosition((prev) => ({ ...prev, cursor: newC }));
			setC(newC);
		} else {
			cachePosition((prev) => ({ ...prev, cursor: update }));
			setC(update);
		}
	};
	const setFocus = (update: SetStateAction<number>) => {
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
