import type { VFC } from "react";
import type { TweetV1 } from "twitter-api-v2";
import type { Item } from "../SelectInput";
import type { TweetItemProps } from "./types";

import { NoRotateSelect } from "../SelectInput";
import { TweetItem } from "./TweetItem";
import { TweetIndicator } from "./TweetIndicator";
import { Selected } from "./Selected";

const TweetItemWrapper: VFC<TweetItemProps> = ({ value }) => {
	return <TweetItem tweet={value} />;
};

interface Props {
	tweets: TweetV1[];
	onSelectTweet: (item: { value: TweetV1 }) => void;
	onHighlightTweet: (item: { value: TweetV1 }) => void;
	limit: number;
}

export const Timeline = ({
	tweets,
	onSelectTweet,
	onHighlightTweet,
	limit,
}: Props) => {
	const items: Item<TweetV1>[] = tweets.map((t) => ({
		key: t.id_str,
		label: t.full_text,
		value: t,
	}));

	return (
		<NoRotateSelect
			items={items}
			onSelect={onSelectTweet}
			onHighlight={onHighlightTweet}
			indicatorComponent={TweetIndicator}
			itemComponent={TweetItemWrapper}
			selectedComponent={Selected}
			limit={limit}
		/>
	);
};
