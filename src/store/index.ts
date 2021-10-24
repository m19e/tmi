import { atom } from "jotai";
import { Column, TimelineHintKey } from "../types";
import { hintMap } from "../consts";

export const columnMapAtom = atom(
	new Map<string, Column>([
		["Home", { type: "home", name: "Home", timeline: [] }],
		["Mentions", { type: "mentions", name: "Mentions", timeline: [] }],
	])
);

export const currentColumnKeyAtom = atom<string>("Home");

export const currentColumnValueAtom = atom<Column>((get) => {
	const map = get(columnMapAtom);
	const key = get(currentColumnKeyAtom);
	return map.get(key);
});

export const requestResultAtom = atom<string | undefined>(undefined);

export const errorAtom = atom<string | undefined>(undefined);

export const hintKeyAtom = atom<TimelineHintKey>("none");

export const hintValueAtom = atom<string | undefined>((get) =>
	hintMap.get(get(hintKeyAtom))
);
