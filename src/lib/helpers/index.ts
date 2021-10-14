import { ApiResponseError } from "twitter-api-v2";
import { HandledResponseError } from "../../types";

type Endpoint = "lists/list" | "lists/statuses";

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
