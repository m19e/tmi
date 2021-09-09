import type Twitter from "twitter-lite";
import type { GetListTweetsParams } from "../types";
import type { Tweet } from "../types/twitter";

export const postReply = async (
	client: Twitter,
	params: {
		status: string;
		in_reply_to_status_id: string;
	}
): Promise<null | any> => {
	try {
		await client.post("statuses/update", params);
		return null;
	} catch (error) {
		return error;
	}
};

export const postDeleteTweet = async (
	client: Twitter,
	params: {
		id: string;
	}
): Promise<null | any> => {
	try {
		await client.post("statuses/destroy", params);
		return null;
	} catch (error) {
		return error;
	}
};

export const getListTweets = async (
	client: Twitter,
	params: GetListTweetsParams
): Promise<Tweet[] | string> => {
	try {
		return await client.get("lists/statuses", params);
	} catch (error) {
		return "Get ListsStatuses Error";
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
		return "Post StatusesUpdate Error";
	}
};
