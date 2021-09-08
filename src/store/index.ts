import { atom } from "jotai";
import type Twitter from "twitter-lite";
import { Tweet } from "../types/twitter";

export const userIdAtom = atom("");

export const clientAtom = atom<Twitter | null>(null);

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
