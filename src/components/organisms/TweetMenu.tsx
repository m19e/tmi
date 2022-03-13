import type { VFC } from "react";
import type { TweetV1 } from "twitter-api-v2";
import { useUserConfig } from "../../hooks";

interface Props {
	tweet: TweetV1;
}

export const TweetMenu: VFC<Props> = ({ tweet }) => {
	const [{ userId }] = useUserConfig();

	const t = tweet.retweeted_status ?? tweet;
	const myTweet = t.user.id_str === userId;
	// const quoteUrl = `https://twitter.com/${t.user.screen_name}/status/${t.id_str}`;

	return null;
};
