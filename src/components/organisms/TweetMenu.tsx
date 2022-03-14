import { useState, useCallback } from "react";
import type { VFC } from "react";
import type { TweetV1 } from "twitter-api-v2";
import SelectInput from "../molecules/SelectInput";
import type { Item } from "../molecules/SelectInput";
import {
	useHint,
	useError,
	useRequestResult,
	useUserConfig,
} from "../../hooks";
import { useApi } from "../../hooks/api";
import type { Updater } from "../molecules/Timeline/types";

import { BreakLineItem } from "../atoms/BreakLineItem";

type TweetMenuActionTarget = "user" | "retweets" | "quotes" | "client";

type TweetMenuAction =
	| "mention"
	| "delete"
	| "re-draft"
	| "block"
	| `mute-${TweetMenuActionTarget}`;

interface Props {
	tweet: TweetV1;
	updater: Updater;
}

export const TweetMenu: VFC<Props> = ({ tweet, updater }) => {
	const [, setHint] = useHint();
	const [, setError] = useError();
	const [, setRequestResult] = useRequestResult();
	const [{ userId }] = useUserConfig();

	const api = useApi();

	const [isMenuOpen, setIsMenuOpen] = useState(true);

	const t = tweet.retweeted_status ?? tweet;
	const myTweet = t.user.id_str === userId;
	// const quoteUrl = `https://twitter.com/${t.user.screen_name}/status/${t.id_str}`;

	const items: Item<TweetMenuAction>[] = [].concat(
		[
			{
				label: `Tweet to @${t.user.screen_name}`,
				value: "mention",
			},
		],
		myTweet
			? [
					{ label: "Delete", value: "delete" },
					{ label: "Re-draft", value: "re-draft" },
			  ]
			: [
					{ label: `Mute @${t.user.screen_name}`, value: "mute-user" },
					{ label: "Mute Retweets from User", value: "mute-retweets" },
					{ label: `Block @${t.user.screen_name}`, value: "block" },
			  ]
	);

	const deleteTweet = useCallback(async () => {
		const error = await api.deleteTweet(t.id_str);
		if (typeof error === "string") {
			setError(error);
			return;
		}
		setRequestResult(`Successfully deleted: "${t.full_text}"`);
		updater.remove(t.id_str);
	}, [t]);

	const handleSelectMenu = ({ value: action }: { value: TweetMenuAction }) => {
		setIsMenuOpen(false);
		if (action === "mention") {
			// mention()
		} else if (action === "delete") {
			deleteTweet();
		} else if (action === "re-draft") {
			// redraft()
		}
	};

	if (isMenuOpen) {
		return (
			<SelectInput
				items={items}
				onSelect={handleSelectMenu}
				itemComponent={BreakLineItem}
			/>
		);
	}
	return null;
};
