import { TimelineHintKey } from "../types";

type HintPair = [key: TimelineHintKey, value: string | undefined];

type HintPairArray = Array<HintPair>;

const hintPairArray: HintPairArray = [
	["none", undefined],
	[
		"timeline",
		"[R] reply [T] retweet [F] favorite [N] tweet [Enter] detail [L] list",
	],
	["timeline/new/input", "[Enter] done [ESC] close"],
	["timeline/new/wait-return", "[Enter] tweet [ESC] cancel"],
	[
		"timeline/detail",
		"[R] reply [Q] quote [T] retweet [F] favorite [ESC] back",
	],
	["timeline/detail/input", "[Enter] done [ESC] close"],
	["timeline/detail/wait-return", "[Enter] tweet [ESC] cancel"],
];

export const hintMap = new Map<TimelineHintKey, string | undefined>(
	hintPairArray
);
