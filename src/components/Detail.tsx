import React, { useState } from "react";
import type { FC } from "react";
import { Text, Box, Newline, useInput } from "ink";
import Divider from "ink-divider";
import useDimensions from "ink-use-stdout-dimensions";
import TextInput from "ink-text-input";
import SelectInput, { ItemProps } from "ink-select-input";
import { parseTweet, ParsedTweet } from "twitter-text";

import { Tweet } from "../types/twitter";
import { getDisplayTime } from "../lib";
import { postReplyApi, postDeleteTweetApi } from "../lib/api";
import { useUserId, useClient } from "../hooks";
import Loader from "./Loader";

type TimelineProcess =
	| "none"
	| "update"
	| "reply"
	| "rt"
	| "fav"
	| "tweet"
	| "delete";

const Detail = ({
	tweet,
	onRemove,
	isReplyOpen,
	setIsReplyOpen,
	inProcess,
	setInProcess,
}: {
	tweet: Tweet;
	onRemove: (options?: { redraft: boolean }) => void;
	isReplyOpen: boolean;
	setIsReplyOpen: (b: boolean) => void;
	inProcess: TimelineProcess;
	setInProcess: (p: TimelineProcess) => void;
}) => {
	const [client] = useClient();
	const [userId] = useUserId();
	const [cols] = useDimensions();

	const [waitReturn, setWaitReturn] = useState(false);
	const [replyText, setReplyText] = useState("");
	const [{ weightedLength, valid }, setParsedTweet] = useState<ParsedTweet>(
		parseTweet("")
	);

	const t = tweet.retweeted_status ?? tweet;
	const time = getDisplayTime(t.created_at);
	const displayFavRT =
		t.retweet_count !== 0 ||
		t.favorite_count !== 0 ||
		inProcess === "rt" ||
		inProcess === "fav";

	const myTweet = t.user.id_str === userId;
	let selectItems: SelectItemProps[] = [
		{
			label: `Tweet to @${t.user.screen_name}`,
			value: "mention",
		},
	];
	if (myTweet) {
		selectItems = selectItems.concat([
			{ label: "Delete", value: "delete" },
			{ label: "Re-draft", value: "redraft" },
		]);
	} else {
		selectItems = selectItems.concat([
			{ label: `Mute @${t.user.screen_name}`, value: "mute-account" },
			{ label: "Mute Retweets from user", value: "mute-retweets" },
			{ label: "Mute Quotes from User", value: "mute-quotes" },
			{ label: `Block @${t.user.screen_name}`, value: "block-account" },
		]);
	}
	selectItems = selectItems.concat([
		{
			label: `Mute "${t.source.replace(/(<([^>]+)>)/gi, "")}"`,
			value: "mute-client",
		},
	]);

	const resetReplyState = () => {
		setIsReplyOpen(false);
		setWaitReturn(false);
		setReplyText("");
		setParsedTweet(parseTweet(""));
	};

	const reply = async () => {
		setInProcess("reply");
		const error = await postReplyApi(client, {
			status: replyText,
			in_reply_to_status_id: t.id_str,
		});
		setInProcess("none");
		if (error !== null) {
			// onError()
			return;
		}
		resetReplyState();
	};

	const deleteTweet = async (
		{
			redraft,
		}: {
			redraft: boolean;
		} = { redraft: false }
	) => {
		setInProcess("delete");
		const error = await postDeleteTweetApi(client, { id: t.id_str });
		setInProcess("none");
		if (error !== null) {
			// onError
			return;
		}
		onRemove({ redraft });
		resetReplyState();
	};

	useInput(
		(input, key) => {
			if (input === "r") {
				setIsReplyOpen(true);
			}
		},
		{ isActive: !isReplyOpen && inProcess === "none" }
	);

	useInput(
		(input, key) => {
			if (key.escape) {
				if (waitReturn) {
					setWaitReturn(false);
					return;
				}
				// Avoid warning: state update on an unmounted TextInput
				// Maybe caused by Node.js (single-threaded)?
				setTimeout(() => {
					setReplyText("");
					setIsReplyOpen(false);
				});
			} else if (waitReturn && key.return) {
				reply();
			}
		},
		{ isActive: isReplyOpen && inProcess === "none" }
	);

	const handleReplyChange = (value: string) => {
		setReplyText(value);
		setParsedTweet(parseTweet(value));
	};

	const handleSelectMenu = ({ value }: { label: string; value: string }) => {
		if (value === "delete") {
			deleteTweet();
		} else if (value === "redraft") {
			deleteTweet({ redraft: true });
		}
	};

	return (
		<>
			<Box flexGrow={1} flexDirection="column" alignItems="center">
				<Box
					flexDirection="column"
					minWidth={30}
					width={Math.floor(cols / 2)}
					paddingX={1}
				>
					<Text color="#00acee">{t.user.name}</Text>
					<Text dimColor>
						@{t.user.screen_name}
						{t.user.protected && " 🔒"}
					</Text>
					<Box flexDirection="column" paddingY={1}>
						<Text>{t.full_text}</Text>
						{t.entities.media && <Text dimColor>(with Media)</Text>}
					</Box>
					<Text dimColor>
						{time}・{t.source.replace(/(<([^>]+)>)/gi, "")}
					</Text>
				</Box>
				<Divider width={Math.max(30, Math.floor(cols / 2))} />
				{displayFavRT && (
					<>
						<Box minWidth={30} width={Math.floor(cols / 2)} paddingX={1}>
							<Text>
								{t.retweet_count !== 0 && <Text>{t.retweet_count} </Text>}
								{(inProcess === "rt" || t.retweet_count !== 0) && (
									<>
										<Text color={t.retweeted ? "green" : "white"}>RT </Text>
										<Loader
											loading={inProcess === "rt"}
											namedColor="green"
										/>{" "}
									</>
								)}
								{t.favorite_count !== 0 && <Text>{t.favorite_count} </Text>}
								{(inProcess === "fav" || t.favorite_count !== 0) && (
									<Text color={t.favorited ? "yellow" : "white"}>fav </Text>
								)}
								<Loader loading={inProcess === "fav"} namedColor="yellow" />
							</Text>
						</Box>
						<Divider width={Math.max(30, Math.floor(cols / 2))} />
					</>
				)}
				{isReplyOpen && (
					<Box
						minWidth={30}
						width={Math.floor(cols / 2)}
						flexDirection="column"
					>
						<Box justifyContent="space-between" paddingX={1}>
							<Text color="gray">
								Replying to <Text color="#00acee">@{t.user.screen_name} </Text>
								<Loader loading={inProcess === "reply"} rawColor="#00acee" />
							</Text>
							<Text color="gray">{280 - weightedLength}</Text>
						</Box>
						<Box minHeight={5} borderStyle="round" borderColor="#777777">
							<TextInput
								placeholder="Tweet your reply"
								value={replyText}
								onChange={handleReplyChange}
								onSubmit={() => setWaitReturn(valid)}
								focus={!waitReturn}
							/>
						</Box>
					</Box>
				)}
				{!isReplyOpen && (
					<Box
						justifyContent="flex-end"
						minWidth={30}
						width={Math.floor(cols / 2)}
					>
						<Box flexDirection="column">
							<Box paddingX={1}>
								<Text color="gray">
									Menu{" "}
									<Loader
										loading={inProcess === "delete"}
										namedColor="redBright"
									/>
								</Text>
							</Box>
							<Box paddingRight={2} borderStyle="round" borderColor="gray">
								<SelectInput
									items={selectItems}
									itemComponent={SelectItem}
									indicatorComponent={Indicator}
									onSelect={handleSelectMenu}
								/>
							</Box>
						</Box>
					</Box>
				)}
			</Box>
			{isReplyOpen ? (
				<>
					{waitReturn ? (
						<Text>[Enter] reply [ESC] cancel</Text>
					) : (
						<Text>[Enter] done [ESC] close</Text>
					)}
				</>
			) : (
				<Text>[R] reply [T] retweet [F] favorite [ESC] back</Text>
			)}
		</>
	);
};

interface SelectItemProps extends ItemProps {
	value: string;
	newline?: boolean;
}

const SelectItem: FC<SelectItemProps> = ({
	isSelected = false,
	label,
	newline = false,
}) => (
	<>
		<Text color={isSelected ? "#00acee" : undefined}>{label}</Text>
		{newline && <Newline />}
	</>
);

const Indicator: FC<{
	isSelected?: boolean;
}> = ({ isSelected = false }) => (
	<Box marginRight={1}>
		{isSelected ? <Text color="#00acee">❯</Text> : <Text> </Text>}
	</Box>
);

export default Detail;
