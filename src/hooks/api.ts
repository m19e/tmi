import type {
	TweetV1,
	ListV1,
	TweetV1TimelineParams,
	ListStatusesV1Params,
} from "twitter-api-v2";
import type { HandledResponseError } from "../types";
import type { TweetV1SearchParams } from "../types/twitter";
import { convertTweetToDisplayable } from "../lib";
import { handleResponseError } from "../lib/helpers";
import { useTwitterClient } from "../hooks";

type PromiseWithError<T> = Promise<T | HandledResponseError>;
type PromiseWithErrorMessage<T> = Promise<T | HandledResponseError["message"]>;

interface Api {
	getHomeTweets: (
		params: TweetV1TimelineParams
	) => PromiseWithErrorMessage<TweetV1[]>;
	getMentionTweets: (
		params: TweetV1TimelineParams
	) => PromiseWithErrorMessage<TweetV1[]>;
	getLists: () => PromiseWithError<ListV1[]>;
	getListTweets: (
		params: ListStatusesV1Params
	) => PromiseWithErrorMessage<TweetV1[]>;
	getTweet: (id: string) => PromiseWithErrorMessage<TweetV1>;
	tweet: (status: string) => PromiseWithErrorMessage<null>;
	reply: (
		status: string,
		in_reply_to_status_id: string
	) => PromiseWithErrorMessage<null>;
	quote: (
		status: string,
		attachment_url: string
	) => PromiseWithErrorMessage<null>;
	deleteTweet: (id: string) => PromiseWithErrorMessage<null>;

	search: (params: TweetV1SearchParams) => PromiseWithErrorMessage<TweetV1[]>;
	favorite: (id: string) => PromiseWithErrorMessage<TweetV1>;
	unfavorite: (id: string) => PromiseWithErrorMessage<TweetV1>;
	retweet: (id: string) => PromiseWithErrorMessage<TweetV1>;
	unretweet: (id: string) => PromiseWithErrorMessage<TweetV1>;
}

export const useApi = (): Api => {
	const [{ v1: api }] = useTwitterClient();

	const getHomeTweets = async (params: TweetV1TimelineParams) => {
		try {
			return (await api.homeTimeline(params)).tweets.map(
				convertTweetToDisplayable
			);
		} catch (error) {
			return handleResponseError(error, "GET", "statuses/home_timeline")
				.message;
		}
	};
	const getMentionTweets = async (params: TweetV1TimelineParams) => {
		try {
			return (await api.mentionTimeline(params)).tweets.map(
				convertTweetToDisplayable
			);
		} catch (error) {
			return handleResponseError(error, "GET", "statuses/mentions_timeline")
				.message;
		}
	};
	const getLists = async () => {
		try {
			return await api.lists();
		} catch (error) {
			return handleResponseError(error, "GET", "lists/list");
		}
	};
	const getListTweets = async (params: ListStatusesV1Params) => {
		try {
			return (await api.listStatuses(params)).tweets.map(
				convertTweetToDisplayable
			);
		} catch (error) {
			return handleResponseError(error, "GET", "lists/statuses").message;
		}
	};
	const getTweet = async (id: string) => {
		try {
			return convertTweetToDisplayable(await api.singleTweet(id));
		} catch (error) {
			return handleResponseError(error, "GET", "statuses/show").message;
		}
	};

	const tweet = async (status: string) => {
		try {
			await api.tweet(status);
			return null;
		} catch (error) {
			return handleResponseError(error, "POST", "statuses/update").message;
		}
	};
	const reply = async (status: string, in_reply_to_status_id: string) => {
		try {
			await api.reply(status, in_reply_to_status_id);
			return null;
		} catch (error) {
			return handleResponseError(error, "POST", "statuses/update").message;
		}
	};
	const quote = async (status: string, attachment_url: string) => {
		try {
			await api.tweet(status, { attachment_url });
			return null;
		} catch (error) {
			return handleResponseError(error, "POST", "statuses/update").message;
		}
	};
	const deleteTweet = async (id: string) => {
		try {
			await api.deleteTweet(id);
			return null;
		} catch (error) {
			return handleResponseError(error, "POST", "statuses/destroy").message;
		}
	};

	// Local http wrappers
	const search = async (params: TweetV1SearchParams) => {
		try {
			const { statuses } = await api.get<{ statuses: TweetV1[] }>(
				"search/tweets.json",
				{ ...params }
			);
			return statuses.map(convertTweetToDisplayable);
		} catch (error) {
			return handleResponseError(error, "GET", "search/tweets").message;
		}
	};
	const favorite = async (id: string) => {
		try {
			await api.post("favorites/create.json", { id });
			return await getTweet(id);
		} catch (error) {
			return handleResponseError(error, "POST", "favorites/create").message;
		}
	};
	const unfavorite = async (id: string) => {
		try {
			await api.post("favorites/destroy.json", { id });
			return await getTweet(id);
		} catch (error) {
			return handleResponseError(error, "POST", "favorites/destroy").message;
		}
	};
	const retweet = async (id: string) => {
		try {
			await api.post(`statuses/retweet/${id}.json`);
			return await getTweet(id);
		} catch (error) {
			return handleResponseError(error, "POST", "statuses/retweet").message;
		}
	};
	const unretweet = async (id: string) => {
		try {
			await api.post(`statuses/unretweet/${id}.json`);
			return await getTweet(id);
		} catch (error) {
			return handleResponseError(error, "POST", "statuses/unretweet").message;
		}
	};

	return {
		getHomeTweets,
		getMentionTweets,
		getLists,
		getListTweets,
		getTweet,
		tweet,
		reply,
		quote,
		deleteTweet,
		search,
		favorite,
		unfavorite,
		retweet,
		unretweet,
	};
};
