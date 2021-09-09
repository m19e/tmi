import type Twitter from "twitter-lite";
import type { GetListTweetsParams } from "../types";
import type { Tweet } from "../types/twitter";

export const postReply = async (
	client: Twitter,
	params: {
		status: string;
		in_reply_to_status_id: string;
	}
): Promise<null | string> => {
	try {
		await client.post("statuses/update", params);
		return null;
	} catch (_error) {
		return "Error: POST statuses/update";
	}
};

export const postDeleteTweet = async (
	client: Twitter,
	params: {
		id: string;
	}
): Promise<null | string> => {
	try {
		await client.post("statuses/destroy", params);
		return null;
	} catch (_error) {
		return "Error: POST statuses/destroy";
	}
};

export const getListTweets = async (
	client: Twitter,
	params: GetListTweetsParams
): Promise<Tweet[] | string> => {
	try {
		return await client.get("lists/statuses", params);
	} catch (_error) {
		return "Error: GET lists/statuses";
	}
};

export const postTweet = async (
	client: Twitter,
	params: { status: string }
): Promise<null | string> => {
	try {
		await client.post("statuses/update", params);
		return null;
	} catch (_error) {
		return "Error: POST statuses/update";
	}
};
