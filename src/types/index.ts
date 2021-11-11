import type { TwitterApiTokens, TweetV1, UserV1 } from "twitter-api-v2";
import type { TrimmedList } from "./twitter";

interface CachedTimeline {
	timeline: Array<TweetV1>;
	cursor: number;
	focus: number;
}

export type Column =
	| { type: "home"; name: string }
	| {
			type: "mentions";
			name: string;
	  }
	| ({
			type: "list";
			name: string;
			list_id: string;
			user?: UserV1;
	  } & CachedTimeline);

export interface HandledResponseError {
	rateLimit: boolean;
	message: string;
}

export interface UserConfig extends TwitterApiTokens {
	userId: string;
	lists: Array<TrimmedList>;
	filePath: string;
}

export type TimelineProcess =
	| "none"
	| "update"
	| "reply"
	| "quote"
	| "rt"
	| "fav"
	| "tweet"
	| "delete";

type TweetStatus = "input" | "wait-return";

type TimelineStatus = `new/${TweetStatus}`;

type DetailStatus = "detail" | `detail/${TweetStatus}`;

type SubCommand = "unique" | "list" | "search";

export type TimelineHintKey =
	| "none"
	| "timeline"
	| `timeline/${TimelineStatus}`
	| `timeline/${DetailStatus}`
	| `${SubCommand}/timeline`
	| "search/timeline/form";

export interface Paginator {
	fetchFuture: () => Promise<string>;
	fetchPast: () => Promise<string>;
}

export interface Mover {
	prev: (update: () => void) => void;
	next: (update: () => void) => void;
	pageUp: (update: () => void) => void;
	pageDown: (update: () => void) => void;
	top: () => void;
	bottom: () => void;
}
