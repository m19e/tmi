import type { VFC } from "react";
import type { TweetV1 } from "twitter-api-v2";
import { NoRotateSelect } from "../SelectInput";
import type { Item } from "../SelectInput";
import type { TweetItemProps } from "./types";
import { TweetItem } from "./TweetItem";
import { TweetIndicator } from "./TweetIndicator";

const TweetItemWrapper: VFC<TweetItemProps> = ({ value }) => {
	return <TweetItem tweet={value} />;
};

export interface Props {
	tweets: TweetV1[];
	onSelect: (item: { value: TweetV1 }) => void;
	onHighlight: (item: { value: TweetV1 }) => void;
	limit: number;
	isFocused: boolean;
}

export const Timeline = ({
	tweets,
	onSelect,
	onHighlight,
	limit,
	isFocused,
}: Props) => {
	const items: Item<TweetV1>[] = tweets.map((t) => ({
		key: t.id_str,
		label: t.full_text,
		value: t,
	}));

	return (
		<NoRotateSelect
			items={items}
			onSelect={onSelect}
			onHighlight={onHighlight}
			indicatorComponent={TweetIndicator}
			itemComponent={TweetItemWrapper}
			limit={limit}
			isFocused={isFocused}
		/>
	);
};
