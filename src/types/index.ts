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
