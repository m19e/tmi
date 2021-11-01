import { atom } from "jotai";
import type { TwitterApi } from "twitter-api-v2";
import type { UserConfig, Column, TimelineHintKey } from "../types";
import { hintMap } from "../consts";

export const twitterClientAtom = atom<TwitterApi | null>(null);

export const userConfigAtom = atom<UserConfig>({
	appKey: "",
	appSecret: "",
	userId: "",
	lists: [],
	filePath: "",
});

export const columnMapAtom = atom(
	new Map<string, Column>([
		["Home", { type: "home", name: "Home" }],
		["Mentions", { type: "mentions", name: "Mentions" }],
	])
);

export const currentColumnKeyAtom = atom<string>("Home");

export const currentColumnValueAtom = atom<Column>((get) => {
	const map = get(columnMapAtom);
	const key = get(currentColumnKeyAtom);
	return map.get(key);
});

export const displayTweetsCountAtom = atom(5);

export const requestResultAtom = atom<string | undefined>(undefined);

export const errorAtom = atom<string | undefined>(undefined);

export const hintKeyAtom = atom<TimelineHintKey>("none");

export const hintValueAtom = atom<string | undefined>((get) =>
	hintMap.get(get(hintKeyAtom))
);
