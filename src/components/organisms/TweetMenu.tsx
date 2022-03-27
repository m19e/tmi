import { useState, useCallback } from "react";
import type { VFC } from "react";
import type { TweetV1 } from "twitter-api-v2";
import { Text, useInput } from "ink";
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
import { NewTweetBox } from "../molecules/Timeline/NewTweetBox";
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
	const [{ key: location }, setHintKey] = useHint();
	const [, setError] = useError();
	const [, setRequestResult] = useRequestResult();
	const [{ userId }] = useUserConfig();

	const api = useApi();

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isTweetOpen, setIsTweetOpen] = useState(false);
	const [isFetching, setIsFetching] = useState(false);
	const [tweetMode, setTweetMode] = useState<
		"none" | "mention" | "reply" | "quote"
	>("none");

	const t = tweet.retweeted_status ?? tweet;
	const myTweet = t.user.id_str === userId;
	const quoteUrl = `https://twitter.com/${t.user.screen_name}/status/${t.id_str}`;

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

	useInput(
		(input, key) => {
			if (input === "x") setIsMenuOpen((prev) => !prev);
			else if (input === "r") openTweet("reply");
			else if (input === "q") openTweet("quote");
		},
		{ isActive: !isTweetOpen && !isFetching }
	);

	const isActiveCloseTweetBox =
		isTweetOpen && location === "timeline/detail/input" && !isFetching;

	useInput(
		(input, key) => {
			if (key.escape) {
				setIsTweetOpen(false);
				setTweetMode("none");
				setHintKey("timeline/detail");
			}
		},
		{ isActive: isActiveCloseTweetBox }
	);

	const openTweet = (mode: "mention" | "reply" | "quote") => {
		setTweetMode(mode);
		setIsTweetOpen(true);
		if (mode === "mention") {
			setIsMenuOpen(false);
		}
		setHintKey("timeline/detail/input");
	};
	const deleteTweet = useCallback(async () => {
		setIsFetching(true);
		setIsMenuOpen(false);
		const error = await api.deleteTweet(t.id_str);
		if (typeof error === "string") {
			setError(error);
			return;
		}
		setRequestResult(`Successfully deleted: "${t.full_text}"`);
		updater.remove(t.id_str);
		setIsFetching(false);
	}, [t]);

	const handleSelectMenu = ({ value: action }: { value: TweetMenuAction }) => {
		if (action === "mention") {
			openTweet("mention");
		} else if (action === "delete") {
			deleteTweet();
		} else if (action === "re-draft") {
			// TODO implement redraft props passed from User root
			// redraft()
		}
	};

	const handleMentionSubmit = async (text: string) => {
		const err = await api.tweet(text);
		if (typeof err === "string") {
			setError(err);
			return;
		}
		setRequestResult(`Successfully tweeted: "${text}"`);
		setIsTweetOpen(false);
	};
	const handleReplySubmit = async (text: string) => {
		const err = await api.reply(text, t.id_str);
		if (typeof err === "string") {
			setError(err);
			return;
		}
		setRequestResult(
			`Successfully replied to @${t.user.screen_name}: "${text}"`
		);
		setIsTweetOpen(false);
	};
	const handleQuoteSubmit = async (text: string) => {
		const err = await api.quote(text, quoteUrl);
		if (typeof err === "string") {
			setError(err);
			return;
		}
		setRequestResult(`Successfully quoted: "${text}"`);
		setIsTweetOpen(false);
	};

	if (isTweetOpen) {
		if (tweetMode === "mention") {
			return (
				<NewTweetBox
					type="new"
					onSubmit={handleMentionSubmit}
					initialText={`@${t.user.screen_name} `}
				/>
			);
		}
		if (tweetMode === "reply") {
			return (
				<NewTweetBox type="reply" onSubmit={handleReplySubmit} tweet={t} />
			);
		}
		if (tweetMode === "quote") {
			return (
				<NewTweetBox type="quote" onSubmit={handleQuoteSubmit} tweet={t} />
			);
		}
	}
	if (isMenuOpen) {
		return (
			<SelectInput
				items={items}
				onSelect={handleSelectMenu}
				itemComponent={BreakLineItem}
			/>
		);
	}
	return (
		<Text dimColor>
			{isFetching ? "fetching..." : "[X] to open tweet menu"}
		</Text>
	);
};
