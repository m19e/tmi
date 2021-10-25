import type { TwitterApiTokens, TweetV1, UserV1 } from "twitter-api-v2";
import type { TrimmedList } from "./twitter";

interface CachedTimeline {
	timeline: Array<TweetV1>;
	cursor: number;
	focus: number;
}

interface DefaultTimeline extends Omit<CachedTimeline, "timeline"> {}

export type Column =
	| ({ type: "home"; name: string } & DefaultTimeline)
	| ({
			type: "mentions";
			name: string;
	  } & DefaultTimeline)
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

interface DefaultTwitterRequestParams {
	tweet_mode: "extended";
	include_entities: true;
}

export interface GetListTweetsParams extends DefaultTwitterRequestParams {
	list_id: string;
	count: number;
	since_id?: string;
	max_id?: string;
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

export type TimelineHintKey =
	| "none"
	| "timeline"
	| `timeline/${TimelineStatus}`
	| `timeline/${DetailStatus}`;
