import type { TwitterApiTokens, TweetV1 } from "twitter-api-v2";
import type { TrimmedList } from "./twitter";

export type Column =
	| { type: "home"; name: string; timeline: Array<TweetV1> }
	| { type: "mentions"; name: string; timeline: Array<TweetV1> }
	| { type: "list"; name: string; timeline: Array<TweetV1> };

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
