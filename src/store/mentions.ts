import { atom } from "jotai";
import type { TweetV1 } from "twitter-api-v2";
import { displayTweetsCountAtom } from "../store";

export const timelineAtom = atom<TweetV1[]>([]);

export const cursorIndexAtom = atom(0);

export const focusIndexAtom = atom(0);

export const displayMentionsAtom = atom<TweetV1[]>((get) => {
	const cursor = get(cursorIndexAtom);
	const count = get(displayTweetsCountAtom);
	return get(timelineAtom).slice(cursor, cursor + count);
});

export const focusedTweetAtom = atom<TweetV1>(
	(get) => get(displayMentionsAtom)[get(focusIndexAtom)]
);

export const pagingCursorsAtom = atom<{ since_id: string; max_id: string }>(
	(get) => {
		const tweets = get(timelineAtom);
		if (!tweets.length) {
			return { since_id: "0", max_id: "0" };
		}
		const since_id = (BigInt(tweets[0].id_str) + BigInt(1)).toString();
		const max_id = (BigInt(tweets.slice(-1)[0].id_str) - BigInt(1)).toString();
		return { since_id, max_id };
	}
);
