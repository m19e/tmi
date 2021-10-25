import { atom } from "jotai";
import type { TwitterApi, TweetV1 } from "twitter-api-v2";
import { cursorIndexAtom, focusIndexAtom, displayTweetsCountAtom } from "./v2";

export const homeTimelineAtom = atom<Array<TweetV1>>([]);

export const displayHomeTimelineAtom = atom<TweetV1[]>((get) => {
	const cursor = get(cursorIndexAtom);
	const count = get(displayTweetsCountAtom);
	return get(homeTimelineAtom).slice(cursor, cursor + count);
});

export const homeFocusedTweetAtom = atom<TweetV1>(
	(get) => get(displayHomeTimelineAtom)[get(focusIndexAtom)]
);

export const homeTimelineCursorsAtom = atom<{
	since_id: string;
	max_id: string;
}>((get) => {
	const tweets = get(homeTimelineAtom);
	if (!tweets.length) {
		return { since_id: "0", max_id: "0" };
	}
	const since_id = (BigInt(tweets[0].id_str) + BigInt(1)).toString();
	const max_id = (BigInt(tweets.slice(-1)[0].id_str) - BigInt(1)).toString();
	return { since_id, max_id };
});
