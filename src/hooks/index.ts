import { useAtom } from "jotai";
import type { SetStateAction } from "jotai";
import type { TwitterApi } from "twitter-api-v2";
import type { Column, TimelineHintKey } from "../types";
import {
	userConfigAtom,
	twitterClientAtom,
	columnMapAtom,
	currentColumnKeyAtom,
	currentColumnValueAtom,
	displayTweetsCountAtom,
	requestResultAtom,
	errorAtom,
	hintKeyAtom,
	hintValueAtom,
} from "../store";
import { cursorIndexAtom, focusIndexAtom } from "../store/list";

export const useUserConfig = () => useAtom(userConfigAtom);

export const useTwitterClient = (): [
	TwitterApi | null,
	(update?: SetStateAction<TwitterApi>) => void
] => useAtom(twitterClientAtom);

interface ColumnMapActions {
	set: (key: string, value: Column) => void;
	setAll: (iterable: Iterable<readonly [string, Column]>) => void;
	delete: (key: string) => void;
}

export const useColumnMap = (): [Map<string, Column>, ColumnMapActions] => {
	const [columns, setCs] = useAtom(columnMapAtom);
	const actions = {
		set: (key: string, value: Column) => {
			setCs((prev) => {
				const copy = new Map(prev);
				copy.set(key, value);
				return copy;
			});
		},
		setAll: (iterable: Iterable<readonly [string, Column]>) => {
			setCs(new Map(iterable));
		},
		delete: (key: string) => {
			setCs((prev) => {
				const copy = new Map(prev);
				copy.delete(key);
				return copy;
			});
		},
	};
	return [columns, actions];
};

export const useCurrentColumn = (): [
	Column,
	{
		setColumnKey: (key: string) => void;
		updateColumn: (update: SetStateAction<Column>) => void;
	}
] => {
	const [currentKey, setKey] = useAtom(currentColumnKeyAtom);
	const [currentColumn] = useAtom(currentColumnValueAtom);
	const [columns, actions] = useColumnMap();
	const setCursor = useAtom(cursorIndexAtom)[1];
	const setFocus = useAtom(focusIndexAtom)[1];

	const setColumnKey = (key: string) => {
		if (columns.has(key)) {
			if (columns.get(key).type === "list") {
				setCursor(0);
				setFocus(0);
			}
			setKey(key);
		}
	};
	const updateColumn = (update: SetStateAction<Column>) => {
		const newColumn =
			typeof update === "function" ? update(currentColumn) : update;
		actions.set(currentKey, newColumn);
	};

	return [currentColumn, { setColumnKey, updateColumn }];
};

export const useDisplayTweetsCount = () => useAtom(displayTweetsCountAtom);

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
	{ key: TimelineHintKey; value: string | undefined },
	(key: TimelineHintKey) => void
] => {
	const [hintKey, setHintKey]: [
		TimelineHintKey,
		(
			update?: SetStateAction<TimelineHintKey | undefined>
		) => void | Promise<void>
	] = useAtom(hintKeyAtom);
	const [hintValue] = useAtom(hintValueAtom);

	return [{ key: hintKey, value: hintValue }, setHintKey];
};
