import { useAtom } from "jotai";
import {
	homeTimelineAtom,
	displayHomeTimelineAtom,
	homeFocusedTweetAtom,
} from "../store/home";

export const useHomeTimeline = () => useAtom(homeTimelineAtom);

export const getDisplayTimeline = () => useAtom(displayHomeTimelineAtom)[0];

export const getFocusedTweet = () => useAtom(homeFocusedTweetAtom)[0];
