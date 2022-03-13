import type { VFC } from "react";
import type { TweetV1 } from "twitter-api-v2";
import type { Updater } from "../molecules/Timeline/types";
import { useUserConfig } from "../../hooks";

interface Props {
	tweet: TweetV1;
	updater: Updater;
}

export const TweetMenu: VFC<Props> = ({ tweet, updater }) => {
	const [{ userId }] = useUserConfig();

	const t = tweet.retweeted_status ?? tweet;
	const myTweet = t.user.id_str === userId;
	// const quoteUrl = `https://twitter.com/${t.user.screen_name}/status/${t.id_str}`;

	return null;
};
