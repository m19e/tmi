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
	["timeline/detail/reply/input", "[Enter] done [ESC] close"],
	["timeline/detail/reply/wait-return", "[Enter] reply [ESC] cancel"],
	["timeline/detail/quote/input", "[Enter] done [ESC] close"],
	["timeline/detail/quote/wait-return", "[Enter] quote [ESC] cancel"],
];

export const hintMap = new Map<TimelineHintKey, string | undefined>(
	hintPairArray
);
