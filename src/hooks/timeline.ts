import React, { useState, useCallback } from "react";
import type {
	TweetV1,
	UserTimelineV1Paginator,
	ListTimelineV1Paginator,
} from "twitter-api-v2";

import { convertTweetToDisplayable } from "../lib";

interface TimelineHook<T> {
	paginator: T | undefined;
	setPaginator: React.Dispatch<React.SetStateAction<T | undefined>>;
	fetchNext: () => Promise<void>;
	tweets: TweetV1[];
	updateTweet: (target: TweetV1) => void;
	removeTweet: (target_id: string) => void;
	reset: () => void;
}

const useAbstractTimeline = <
	T extends UserTimelineV1Paginator | ListTimelineV1Paginator
>(): TimelineHook<T> => {
	const [paginator, setP] = useState<T>(undefined);
	const [tweets, setTweets] = useState<TweetV1[]>([]);

	const setPaginator: typeof setP = (action) => {
		setP((prevP) => {
			const newPaginator =
				typeof action === "function" ? action(prevP) : action;
			const newTweets = newPaginator.tweets.map(convertTweetToDisplayable);

			setTweets((prevT) =>
				prevT.length ? [...prevT, ...newTweets] : newTweets
			);

			return newPaginator;
		});
	};
	const fetchNext = useCallback(async () => {
		if (typeof paginator === undefined) return;
		const newPaginator = await paginator.next(200);
		setPaginator(newPaginator as T);
	}, [paginator]);
	const updateTweet = (target: TweetV1) => {
		setTweets((prev) =>
			prev.map((t) => (t.id_str === target.id_str ? target : t))
		);
	};
	const removeTweet = (target_id: string) => {
		setTweets((prev) => prev.filter((t) => t.id_str !== target_id));
	};
	const reset = () => {
		setP(undefined);
		setTweets([]);
	};

	return {
		paginator,
		setPaginator,
		fetchNext,
		tweets,
		updateTweet,
		removeTweet,
		reset,
	};
};
export const useUserTimeline = () =>
	useAbstractTimeline<UserTimelineV1Paginator>();
export const useListTimeline = () =>
	useAbstractTimeline<ListTimelineV1Paginator>();
