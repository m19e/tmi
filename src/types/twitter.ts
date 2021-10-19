import type { TweetV1, ListV1 } from "twitter-api-v2";

export interface List extends ListV1 {}

export interface TrimmedList {
	id_str: string;
	name: string;
	mode: "public" | "private";
}

export interface Tweet extends TweetV1 {}

export interface User {
	created_at: string;
	default_profile_image: boolean;
	default_profile: boolean;
	description?: string | null;
	entities: UserEntities;
	favourites_count: number;
	followers_count: number;
	friends_count: number;
	id_str: string;
	id: number;
	listed_count: number;
	location?: string | null;
	name: string;
	profile_banner_url?: string;
	profile_image_url_https: string;
	protected: boolean;
	screen_name: string;
	status?: Tweet;
	statuses_count: number;
	url?: string | null;
	verified: boolean;
	withheld_in_countries?: string[];
	withheld_scope?: string;
}
