import type Twitter from "twitter-lite";
import type { GetListTweetsParams } from "../types";
import type { Tweet, List } from "../types/twitter";

interface TwitterErrorResponse {
	errors: {
		message: string;
		code: number;
	}[];
}

// GET request
export const getUserListsApi = async (
	client: Twitter
): Promise<List[] | string> => {
	try {
		return await client.get("lists/list");
	} catch (error) {
		if (
			(error as TwitterErrorResponse).errors.map((e) => e.code).includes(88)
		) {
			return [];
		} else {
			return `Error: GET lists/list\n${JSON.stringify(error, null, 4)}`;
		}
	}
};

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

export const postFavoriteApi = async (
	client: Twitter,
	params: {
		id: string;
	}
): Promise<null | string> => {
	try {
		await client.post("favorites/create", params);
		return null;
	} catch (_error) {
		return "Error: POST favorites/create";
	}
};

export const postUnfavoriteApi = async (
	client: Twitter,
	params: {
		id: string;
	}
): Promise<null | string> => {
	try {
		await client.post("favorites/destroy", params);
		return null;
	} catch (_error) {
		return "Error: POST favorites/destroy";
	}
};

export const postRetweetApi = async (
	client: Twitter,
	params: {
		id: string;
	}
): Promise<null | string> => {
	try {
		await client.post("statuses/retweet", params);
		return null;
	} catch (_error) {
		return "Error: POST statuses/retweet";
	}
};

export const postUnretweetApi = async (
	client: Twitter,
	params: {
		id: string;
	}
): Promise<null | string> => {
	try {
		await client.post("statuses/unretweet", params);
		return null;
	} catch (_error) {
		return "Error: POST statuses/unretweet";
	}
};
