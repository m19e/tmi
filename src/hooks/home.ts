import { useAtom, SetStateAction } from "jotai";
import { columnMapAtom, currentColumnKeyAtom } from "../store";
import {
	homeTimelineAtom,
	displayHomeTimelineAtom,
	homeFocusedTweetAtom,
} from "../store/home";
import type { TweetV1 } from "twitter-api-v2";

export const useHomeTimeline = (): [
	Array<TweetV1>,
	(update?: SetStateAction<Array<TweetV1>>) => void
] => useAtom(homeTimelineAtom);

export const getDisplayTimeline = () => useAtom(displayHomeTimelineAtom)[0];

export const getFocusedTweet = () => useAtom(homeFocusedTweetAtom)[0];
