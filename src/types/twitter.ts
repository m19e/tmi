import type { TweetV1, ListV1, UserV1 } from "twitter-api-v2";

export interface List extends ListV1 {}

export interface TrimmedList {
	id_str: string;
	name: string;
	mode: "public" | "private";
}

export interface Tweet extends TweetV1 {}

export interface User extends UserV1 {}
