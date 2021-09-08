import { useAtom, SetStateAction } from "jotai";
import type Twitter from "twitter-lite";
import {
	userIdAtom,
	clientAtom,
	timelineAtom,
	displayTimelineAtom,
	cursorIndexAtom,
	focusIndexAtom,
} from "../store";

export const useUserId = () => useAtom(userIdAtom);

export const useClient = (): [
	Twitter | null,
	(update?: SetStateAction<Twitter | null>) => void
] => useAtom(clientAtom);

export const useTimeline = () => useAtom(timelineAtom);

export const getDisplayTimeline = () => useAtom(displayTimelineAtom)[0];

export const useCursorIndex = () => useAtom(cursorIndexAtom);

export const useFocusIndex = () => useAtom(focusIndexAtom);
