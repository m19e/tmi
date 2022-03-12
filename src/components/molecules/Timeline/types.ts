import type { TweetV1 } from "twitter-api-v2";

export interface TweetItemProps {
	isSelected?: boolean;
	label: string;
	value: TweetV1;
}
