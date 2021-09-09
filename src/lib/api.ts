import type Twitter from "twitter-lite";
import type { GetListTweetsParams } from "../types";
import type { Tweet } from "../types/twitter";

// GET request
export const getListTweetsApi = async (
	client: Twitter,
	params: GetListTweetsParams
): Promise<Tweet[] | string> => {
	try {
		return await client.get("lists/statuses", params);
	} catch (_error) {
		return "Error: GET lists/statuses";
	}
};

export const getTweetApi = async (
	client: Twitter,
	params: { id: string }
): Promise<Tweet | string> => {
	try {
		return await client.get("statuses/show", {
			...params,
			trim_user: false,
			include_my_retweet: true,
			tweet_mode: "extended",
			include_entities: true,
		});
	} catch (_error) {
		return "Error: GET statuses/show";
	}
};

// POST request
export const postTweetApi = async (
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

export const postReplyApi = async (
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

export const postDeleteTweetApi = async (
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
