import type { TimelineHintKey } from "../types";

type HintPair = [key: TimelineHintKey, value: string | undefined];

type HintPairArray = Array<HintPair>;

const hintPairArray: HintPairArray = [
	["none", undefined],
	["timeline", "[T] retweet [F] favorite [N] tweet [Enter] detail [C] column"],
	["timeline/new/input", "[Enter] done [ESC] close"],
	["timeline/new/wait-return", "[Enter] tweet [ESC] cancel"],
	[
		"timeline/detail",
		"[R] reply [Q] quote [T] retweet [F] favorite [X] menu [ESC] back",
	],
	["timeline/detail/input", "[Enter] done [ESC] close"],
	["timeline/detail/wait-return", "[Enter] tweet [ESC] cancel"],
	[
		"list/timeline",
		"[T] retweet [F] favorite [N] tweet [Enter] detail [L] list",
	],
];

export const hintMap = new Map<TimelineHintKey, string | undefined>(
	hintPairArray
);
