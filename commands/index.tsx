import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import path from "path";
import {
	mkdirsSync,
	readdirSync,
	existsSync,
	readJsonSync,
	writeJson,
} from "fs-extra";
import { Text, Box, useInput, useApp } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import Twitter, { TwitterOptions } from "twitter-lite";
import { parseTweet, ParsedTweet } from "twitter-text";
import { config as dotenvConfig } from "dotenv";

import { Tweet, List, TrimmedList } from "../src/types/twitter";
import { convertTweetToDisplayable } from "../src/lib";
import Spinner from "../src/components/Spinner";
import TweetItem from "../src/components/TweetItem";

dotenvConfig();

const defaultOptions = {
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
};

interface TwitterErrorResponse {
	errors: TwitterErrors[];
}

interface TwitterErrors {
	message: string;
	code: number;
}

interface Config extends TwitterOptions {
	lists: TrimmedList[];
}

interface DefaultTwitterRequestParams {
	tweet_mode: "extended";
	include_entities: true;
}

interface GetListTimelineParams extends DefaultTwitterRequestParams {
	list_id: string;
	count: number;
	since_id?: string;
	max_id?: string;
}

/// Hello world command
const Tink = ({ name = "" }) => {
	const client = new Twitter(defaultOptions);
	const [ot, setOT] = useState("");
	const [pin, setPIN] = useState("");
	const [filePath, setFilePath] = useState("");
	const [config, setConfig] = useState<Config>({
		...defaultOptions,
		lists: [],
	});

	const [status, setStatus] = useState<"init" | "wait" | "select" | "timeline">(
		"init"
	);
	const [lists, setLists] = useState<TrimmedList[]>([]);
	const [currentList, setCurrentList] = useState<TrimmedList | null>(null);
	const [currentTimeline, setCurrentTimeline] = useState<Tweet[]>([]);

	const [error, setError] = useState("");

	const [cols, rows] = useDimensions();
	const { exit } = useApp();

	useEffect(() => {
		const init = async () => {
			const [fp, conf, err] = getConfig();
			if (err !== null || !conf.access_token_key || !conf.access_token_secret) {
				if (err !== null) {
					console.error("cannot get configuration: ", err);
					exit();
				}
				setFilePath(fp);

				const rt = await client.getRequestToken("oob");
				const { oauth_token } = rt as {
					oauth_token: string;
				};
				setOT(oauth_token);
				setStatus("wait");
			} else {
				setFilePath(fp);
				setConfig(conf);
				await getUserLists(conf, fp);
				setStatus("select");
			}
		};

		init();
	}, []);

	const getConfig = (profile: string = ""): [string, Config | null, any] => {
		let dir = process.env.HOME ?? "";
		if (dir === "" && process.platform === "win32") {
			dir = process.env.APPDATA ?? "";
			if (dir === "") {
				dir = path.join(
					process.env.USERPROFILE ?? "",
					"Application Data",
					"tink"
				);
			}
		} else {
			dir = path.join(dir, ".config", "tink");
		}

		try {
			mkdirsSync(dir);
		} catch (err) {
			return ["", null, err];
		}

		let file = "";
		if (profile === "") {
			file = path.join(dir, "settings.json");
		} else if (profile === "?") {
			try {
				const names = readdirSync(dir, { withFileTypes: true })
					.filter(
						(d) =>
							d.isFile() &&
							path.extname(d.name) === ".json" &&
							d.name.match(/^settings-/)
					)
					.map((d) => path.parse(d.name).name.replace("settings-", ""));

				console.log(names.length ? names.join("\n") : "tink has no accounts.");
				exit();
			} catch (err) {
				return ["", null, err];
			}
		} else {
			file = path.join(dir, "settings-" + profile + ".json");
		}

		let conf: Config;
		const json = readJsonSync(file, { throws: false });
		if (json === null) {
			if (existsSync(file)) {
				return ["", null, "CANNOT READ JSON"];
			}
			conf = { ...defaultOptions, lists: [] };
		} else {
			conf = json;
		}

		return [file, conf, null];
	};

	const getUserLists = async (config: Config, fp: string) => {
		const { lists, ...options } = config;
		const user = new Twitter(options);

		try {
			const data: List[] = await user.get("lists/list");
			const trim: TrimmedList[] = data.map((l) => ({
				id_str: l.id_str,
				name: l.name,
				mode: l.mode,
			}));
			await writeJson(fp, { ...options, lists: trim });
			setLists(trim);
			setStatus("select");
		} catch (err) {
			if (
				(err as TwitterErrorResponse).errors.map((e) => e.code).includes(88)
			) {
				console.error("rate limit exceeded.");
				setLists(lists);
				setStatus("select");
			} else {
				console.error(err);
				exit();
			}
		}
	};

	const getListTimeline = async (
		list_id: string,
		options: { backward: boolean; select: boolean }
	): Promise<number> => {
		const user = new Twitter(config);
		const params = createGetListTimelineParams(list_id, {
			...options,
			count: 200,
		});

		try {
			const data: Tweet[] = await user.get("lists/statuses", params);
			const converted = data.map((t) => convertTweetToDisplayable(t));
			setCurrentTimeline((prev) => {
				if (options.select) return converted;
				return options.backward
					? prev.slice(0, -1).concat(converted)
					: converted.concat(prev);
			});
			return data.length;
		} catch (err) {
			console.log(err);
			return 0;
		}
	};

	const createGetListTimelineParams = (
		list_id: string,
		options: { backward: boolean; count: number; select: boolean }
	): GetListTimelineParams => {
		const { backward, count, select } = options;
		const params: GetListTimelineParams = {
			tweet_mode: "extended",
			include_entities: true,
			list_id,
			count,
		};
		if (select) return params;
		if (backward) {
			const oldest = currentTimeline.slice(-1)[0];
			return { ...params, max_id: oldest.id_str };
		}
		const newest = currentTimeline[0];
		return { ...params, since_id: newest.id_str };
	};

	const handleFavorite = async ({
		id_str,
		favorited,
	}: Tweet): Promise<Tweet | null> => {
		const user = new Twitter(config);
		try {
			if (favorited) {
				await user.post("favorites/destroy", {
					id: id_str,
					tweet_mode: "extended",
					include_entities: true,
				});
			} else {
				await user.post("favorites/create", {
					id: id_str,
					tweet_mode: "extended",
					include_entities: true,
				});
			}

			const res: Tweet = await user.get("statuses/show", {
				id: id_str,
				trim_user: false,
				include_my_retweet: true,
				tweet_mode: "extended",
				include_entities: true,
			});

			const converted = convertTweetToDisplayable(res);
			setCurrentTimeline((prev) =>
				prev.map((t) => (t.id_str === id_str ? converted : t))
			);
			return converted;
		} catch (err) {
			return null;
		}
	};

	const handleRetweet = async ({
		id_str,
		retweeted,
	}: Tweet): Promise<Tweet | null> => {
		const user = new Twitter(config);

		try {
			if (retweeted) {
				await user.post("statuses/unretweet", {
					id: id_str,
				});
			} else {
				await user.post("statuses/retweet", {
					id: id_str,
				});
			}

			const res: Tweet = await user.get("statuses/show", {
				id: id_str,
				trim_user: false,
				include_my_retweet: true,
				tweet_mode: "extended",
				include_entities: true,
			});

			const converted = convertTweetToDisplayable(res);
			setCurrentTimeline((prev) =>
				prev.map((t) => (t.id_str === id_str ? converted : t))
			);
			return converted;
		} catch (err) {
			return null;
		}
	};

	const handleNewTweet = async (status: string): Promise<null | any> => {
		const user = new Twitter(config);

		try {
			await user.post("statuses/update", {
				status,
			});
			return null;
		} catch (err) {
			return err;
		}
	};

	const handleSubmitPinAuth = async (p: string) => {
		const token = await client.getAccessToken({
			oauth_verifier: p,
			oauth_token: ot,
		});

		const conf = {
			...defaultOptions,
			access_token_key: token.oauth_token,
			access_token_secret: token.oauth_token_secret,
			lists: [],
		};

		await writeJson(filePath, conf);
		await getUserLists(conf, filePath);
		setConfig(conf);
		setStatus("select");
	};

	const handleSelect = async ({
		value,
	}: {
		label: string;
		value: TrimmedList;
	}) => {
		await getListTimeline(value.id_str, { backward: false, select: true });
		setCurrentList(value);
		setStatus("timeline");
	};

	const handleToggleList = () => {
		setStatus("select");
	};

	const handleUpdate = async (backward: boolean): Promise<number> =>
		await getListTimeline(currentList.id_str, {
			backward,
			select: false,
		});

	return (
		<Box flexDirection="column" minHeight={rows}>
			<Text>{error}</Text>
			{status === "wait" && (
				<>
					<Text color="redBright">Open URL and enter PIN.</Text>
					<Text>
						{"https://api.twitter.com/oauth/authenticate?oauth_token=" + ot}
					</Text>
					<Box>
						<Text>PIN: </Text>
						<TextInput
							value={pin}
							onChange={(value) => setPIN(value)}
							onSubmit={handleSubmitPinAuth}
						/>
					</Box>
				</>
			)}
			{status === "select" && (
				<>
					<Text>Select list to display.</Text>
					<SelectInput
						items={lists.map((l) => ({
							key: l.id_str,
							label: l.name + (l.mode === "private" ? " 🔒" : ""),
							value: l,
						}))}
						onSelect={handleSelect}
					/>
				</>
			)}
			{status === "timeline" && (
				<>
					<Box justifyContent="center" borderStyle="double" borderColor="gray">
						<Text>
							[LIST]<Text color="green">{currentList.name}</Text>
						</Text>
					</Box>
					<Timeline
						timeline={currentTimeline}
						onToggleList={handleToggleList}
						onUpdate={handleUpdate}
						onNewTweet={handleNewTweet}
						onFav={handleFavorite}
						onRT={handleRetweet}
					/>
				</>
			)}
		</Box>
	);
};

const DISPLAY_TWEETS_COUNT = 5;

const Timeline = ({
	timeline,
	onToggleList,
	onUpdate,
	onNewTweet,
	onFav,
	onRT,
}: {
	timeline: Tweet[];
	onToggleList: () => void;
	onUpdate: (backward: boolean) => Promise<number>;
	onNewTweet: (s: string) => Promise<null | any>;
	onFav: (t: Tweet) => Promise<Tweet | null>;
	onRT: (t: Tweet) => Promise<Tweet | null>;
}) => {
	const [cursor, setCursor] = useState(0);
	const [focus, setFocus] = useState(0);
	const [displayTimeline, setDisplayTimeline] = useState<Tweet[]>(
		timeline.slice(0, DISPLAY_TWEETS_COUNT)
	);
	const [fetching, setFetching] = useState(false);

	const [isNewTweetOpen, setIsNewTweetOpen] = useState(false);
	const [waitReturn, setWaitReturn] = useState(false);
	const [tweetText, setTweetText] = useState("");
	const [{ weightedLength, valid }, setParsedTweet] = useState<ParsedTweet>(
		parseTweet("")
	);

	const update = async (backward: boolean) => {
		setFetching(true);
		const len = await onUpdate(backward);
		if (!backward) setCursor(cursor + len);
		setFetching(false);
	};

	const newTweet = async () => {
		if (!valid) return;
		setFetching(true);
		const err = await onNewTweet(tweetText);
		if (err !== null) {
			// onError()
		} else {
			setIsNewTweetOpen(false);
			setTweetText("");
		}
		setFetching(false);
	};

	const fav = async () => {
		setFetching(true);
		const res = await onFav(displayTimeline[focus]);
		if (res === null) {
			// onError()
		} else {
			setDisplayTimeline((prev) =>
				prev.map((t) => (t.id_str === res.id_str ? res : t))
			);
		}
		setFetching(false);
	};

	const rt = async () => {
		setFetching(true);
		const res = await onRT(displayTimeline[focus]);
		if (res === null) {
			// onError()
		} else {
			setDisplayTimeline((prev) =>
				prev.map((t) => (t.id_str === res.id_str ? res : t))
			);
		}
		setFetching(false);
	};

	useInput(
		(input, key) => {
			if (fetching) return;

			if (key.upArrow || (key.shift && key.tab)) {
				if (focus === 0) {
					if (cursor === 0) {
						update(false);
					} else {
						setDisplayTimeline(
							timeline.slice(cursor - 1, cursor + DISPLAY_TWEETS_COUNT - 1)
						);
						setCursor((prev) => prev - 1);
					}
				} else {
					setFocus((prev) => prev - 1);
				}
			} else if (key.downArrow || key.tab) {
				if (focus === DISPLAY_TWEETS_COUNT - 1) {
					if (cursor + DISPLAY_TWEETS_COUNT + 1 > timeline.length) {
						update(true);
					} else {
						setDisplayTimeline(
							timeline.slice(cursor + 1, cursor + DISPLAY_TWEETS_COUNT + 1)
						);
						setCursor((prev) => prev + 1);
					}
				} else {
					setFocus((prev) => prev + 1);
				}
			} else if (input === "l") {
				onToggleList();
			} else if (input === "n") {
				setIsNewTweetOpen(true);
			} else if (input === "f") {
				fav();
			} else if (input === "r") {
				rt();
			} else if (key.pageUp) {
				if (cursor + focus < DISPLAY_TWEETS_COUNT) {
					update(false);
				} else {
					const newCursor = Math.max(cursor - DISPLAY_TWEETS_COUNT, 0);
					setDisplayTimeline(
						timeline.slice(newCursor, newCursor + DISPLAY_TWEETS_COUNT)
					);
					setCursor(newCursor);
				}
			} else if (key.pageDown) {
				if (cursor + DISPLAY_TWEETS_COUNT * 2 > timeline.length) {
					update(true);
				} else {
					const newCursor = Math.min(
						cursor + DISPLAY_TWEETS_COUNT,
						timeline.length - DISPLAY_TWEETS_COUNT - 1
					);
					setDisplayTimeline(
						timeline.slice(newCursor, newCursor + DISPLAY_TWEETS_COUNT)
					);
					setCursor(newCursor);
				}
			}
		},
		{ isActive: !isNewTweetOpen }
	);

	useInput(
		(_, key) => {
			if (fetching) return;

			if (key.escape) {
				if (waitReturn) {
					setWaitReturn(false);
					return;
				}
				setIsNewTweetOpen(false);
				setTweetText("");
			} else if (waitReturn && key.return) {
				newTweet();
				setWaitReturn(false);
			}
		},
		{ isActive: isNewTweetOpen }
	);

	const handleNewTweetChange = (value: string) => {
		setTweetText(value);
		setParsedTweet(parseTweet(value));
	};

	return (
		<>
			{/* <Text>
				cursor:{cursor} focus:{focus} len:{timeline.length}
			</Text> */}
			{/* {fetching && (
				<Text>
					<Text color="green">
						<Spinner type="aesthetic" />
					</Text>
					<Text>{" Fetching..."}</Text>
				</Text>
			)} */}
			<Box flexGrow={1} flexDirection="column">
				{displayTimeline.map((t, i) => (
					<TweetItem key={i} tweet={t} isFocused={focus === i} />
				))}
			</Box>
			{isNewTweetOpen ? (
				<>
					<Box justifyContent="space-between" paddingX={1}>
						<Text>New Tweet</Text>
						<Text>{280 - weightedLength}</Text>
					</Box>
					<Box borderStyle="round" borderColor="white">
						<TextInput
							placeholder="What's happening?"
							value={tweetText}
							onChange={handleNewTweetChange}
							onSubmit={() => setWaitReturn(valid)}
							focus={!waitReturn}
						/>
					</Box>
					<Box justifyContent="flex-start" paddingX={1}>
						{waitReturn ? (
							<Text>
								[Enter](<Text underline>AGAIN</Text>) tweet [ESC] cancel
							</Text>
						) : (
							<Text>[Enter] tweet [ESC] close</Text>
						)}
					</Box>
				</>
			) : (
				<Text>[N] tweet [F] favorite [R] retweet</Text>
			)}
		</>
	);
};

Tink.propTypes = {
	/// Name of the person to greet
	name: PropTypes.string,
};

export default Tink;
