import { atom } from "jotai";
import type Twitter from "twitter-lite";
import type { TwitterApi } from "twitter-api-v2";
import { Tweet } from "../types/twitter";

export const userIdAtom = atom("");

export const clientAtom = atom<Twitter | null>(null);

export const twitterClientAtom = atom<TwitterApi | null>(null);

export const timelineAtom = atom<Tweet[]>([]);

export const cursorIndexAtom = atom(0);

export const focusIndexAtom = atom(0);

export const displayTweetsCountAtom = atom(5);

export const displayTimelineAtom = atom<Tweet[]>((get) => {
	const cursor = get(cursorIndexAtom);
	const count = get(displayTweetsCountAtom);

	return get(timelineAtom).slice(cursor, cursor + count);
});

export const focusedTweetAtom = atom<Tweet>(
	(get) => get(displayTimelineAtom)[get(focusIndexAtom)]
);

export const focusedPositionAtom = atom<{ position: number; total: number }>(
	(get) => {
		const cursor = get(cursorIndexAtom);
		const focus = get(focusIndexAtom);
		const { length } = get(timelineAtom);

		return { position: cursor + focus + 1, total: length };
	}
);

export const requestResultAtom = atom<string | undefined>(undefined);

export const errorAtom = atom<string | undefined>(undefined);

export const hintAtom = atom<string | undefined>(undefined);
