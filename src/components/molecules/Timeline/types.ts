import type { TweetV1 } from "twitter-api-v2";

export interface TweetItemProps {
	isSelected?: boolean;
	label: string;
	value: TweetV1;
}

export interface Updater {
	update: (target: TweetV1) => void;
	remove: (target_id: string) => void;
	redraft: (target: TweetV1) => void;
}
