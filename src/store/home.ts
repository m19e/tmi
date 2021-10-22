import { atom } from "jotai";
import type { TwitterApi, TweetV1 } from "twitter-api-v2";

export const homeTimelineAtom = atom<Array<TweetV1>>([]);
