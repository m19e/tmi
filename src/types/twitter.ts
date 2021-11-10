export interface TrimmedList {
	id_str: string;
	name: string;
	owner: {
		id_str: string;
		screen_name: string;
		name: string;
	};
	mode: "public" | "private";
}

export interface TweetV1SearchParams {
	q: string;
	result_type: "mixed" | "recent" | "popular";
	count: number;
	since_id?: string;
	max_id?: string;
	tweet_mode: "extended";
	include_entities: true;
}
