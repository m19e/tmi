import type Twitter from "twitter-lite";
import type { TweetV1, ListV1 } from "twitter-api-v2";
import type { GetListTweetsParams } from "../types";

export interface Tweet extends TweetV1 {}

export interface List extends ListV1 {}

interface TwitterErrorResponse {
	_headers: any;
	errors?: {
		message: string;
		code: number;
	}[];
}

export interface HandledErrorResponse {
	rate_limit: boolean;
	message: string;
}

const handleErrorResponse = (
	e: TwitterErrorResponse,
	method: "GET" | "POST",
	endpoint: string
): HandledErrorResponse => {
	if ("errors" in e && e.errors[0].code === 88) {
		// Twitter API error, and rate limit exceeded
		return {
			rate_limit: true,
			message: `${method} ${endpoint}: Rate limit will reset on ${new Date(
				e._headers.get("x-rate-limit-reset") * 1000
			)}`,
		};
	}
	// some other kind of error, e.g. read-only API trying to POST
	// or non-API error, e.g. network problem or invalid JSON in response
	return {
		rate_limit: false,
		message: `Error: ${method} ${endpoint}\n${JSON.stringify(e, null, 4)}`,
	};
};

// GET request
export const getUserListsApi = async (
	client: Twitter
): Promise<List[] | HandledErrorResponse> => {
	try {
		return await client.get("lists/list");
	} catch (error) {
		return handleErrorResponse(error, "GET", "lists/list");
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
