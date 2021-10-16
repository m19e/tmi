import { atom } from "jotai";
import type { TwitterApi, ListV1, TweetV1 } from "twitter-api-v2";
import { UserConfig } from "../types";
import { TrimmedList } from "../types/twitter";

export const userConfigAtom = atom<UserConfig | null>(null);

export const twitterClientAtom = atom<TwitterApi | null>(null);

export const currentListAtom = atom<TrimmedList | null>(null);

export const listTimelineAtom = atom<TweetV1[]>([]);

export const cursorIndexAtom = atom(0);

export const focusIndexAtom = atom(0);

export const displayTweetsCountAtom = atom(5);

export const displayTimelineAtom = atom<TweetV1[]>((get) => {
	const cursor = get(cursorIndexAtom);
	const count = get(displayTweetsCountAtom);
	return get(listTimelineAtom).slice(cursor, cursor + count);
});

export const focusedTweetAtom = atom<TweetV1>(
	(get) => get(displayTimelineAtom)[get(focusIndexAtom)]
);

export const listTimelineCursorsAtom = atom<{
	since_id: string;
	max_id: string;
}>((get) => {
	const tweets = get(listTimelineAtom);
	if (!tweets.length) {
		return { since_id: "0", max_id: "0" };
	}
	const since_id = (BigInt(tweets[0].id_str) + BigInt(1)).toString();
	const max_id = (BigInt(tweets.slice(-1)[0].id_str) - BigInt(1)).toString();
	return { since_id, max_id };
});
