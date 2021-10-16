import { atom } from "jotai";
import type { TwitterApi, TweetV1 } from "twitter-api-v2";
import { UserConfig } from "../types";

export const userConfigAtom = atom<UserConfig | null>(null);

export const twitterClientAtom = atom<TwitterApi | null>(null);

export const listTimelineAtom = atom<TweetV1[]>([]);

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
