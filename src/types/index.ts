import type { TwitterApiTokens, TweetV1 } from "twitter-api-v2";
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
	| ({ type: "list"; list_id: string; name: string } & CachedTimeline);

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
