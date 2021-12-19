import { ApiResponseError } from "twitter-api-v2";
import { HandledResponseError } from "../../types";

type Endpoint =
	| "statuses/home_timeline"
	| "statuses/mentions_timeline"
	| "statuses/user_timeline"
	| "users/show"
	| "friendships/show"
	| "lists/list"
	| "lists/statuses"
	| "lists/memberships"
	| "lists/members/create"
	| "lists/members/destroy"
	| "statuses/show"
	| "statuses/update"
	| "statuses/destroy"
	| "search/tweets"
	| "favorites/list"
	| "favorites/create"
	| "favorites/destroy"
	| "statuses/retweet"
	| "statuses/unretweet";

export const handleResponseError = (
	error: any,
	method: "GET" | "POST",
	endpoint: Endpoint
): HandledResponseError => {
	if (
		error instanceof ApiResponseError &&
		error.rateLimitError &&
		error.rateLimit
	) {
		return {
			rateLimit: true,
			message: `${method} ${endpoint}: Rate limit will reset on ${new Date(
				error.rateLimit.reset
			)}`,
		};
	}
	return {
		rateLimit: false,
		message: `Error: ${method} ${endpoint}`,
	};
};
