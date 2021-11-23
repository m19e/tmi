import { ApiResponseError } from "twitter-api-v2";
import { HandledResponseError } from "../../types";

type Endpoint =
	| "statuses/home_timeline"
	| "statuses/mentions_timeline"
	| "users/show"
	| "lists/list"
	| "lists/statuses"
	| "statuses/show"
	| "statuses/update"
	| "statuses/destroy"
	| "search/tweets"
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
