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
import { Text, Box, useInput } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import TL, { TwitterOptions } from "twitter-lite";
import { config } from "dotenv";

import { splitGraphemes } from "split-graphemes";
import { Tweet, List, TrimmedList } from "../src/types/twitter";
import { getDisplayTimeAgo } from "../src/lib";
import Spinner from "../src/components/Spinner";

config();

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

const splitWithGraphemes = (text: string): string[] => {
	return splitGraphemes(text);
};

const convertToCorrectWidthText = (text: string): string =>
	splitWithGraphemes(text)
		.map((c) => {
			const spread = [...c];
			if (spread.length === 1) {
				if (
					/[\u{1d400}-\u{1d7ff}\u{1f972}\u{3297}\u{1fab6}\u{1f54a}\u{1f6cf}]/u.test(
						c
					)
				)
					return "▯";
				if (/[\u{fe0f}]/u.test(c)) return "";
				return c;
			}
			return spread
				.filter((f) => !/[\u{1f3fb}-\u{1f3ff}\u{fe0f}]/u.test(f))
				.join("");
		})
		.join("");

/// Hello world command
const Hello = ({ name = "" }) => {
	const client = new TL(defaultOptions);
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

	const [cols, rows] = useDimensions();

	useEffect(() => {
		const init = async () => {
			const [fp, conf, err] = getConfig();
			if (err !== null || !conf.access_token_key || !conf.access_token_secret) {
				if (err !== null) console.error("cannot get configuration: ", err);
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
				process.exit(0);
			} catch (err) {
				return ["", null, err];
			}
		} else {
			file = path.join(dir, "settings-" + profile + ".json");
		}

		let config: Config;
		const json = readJsonSync(file, { throws: false });
		if (json === null) {
			if (existsSync(file)) {
				return ["", null, "CANNOT READ JSON"];
			}
			config = { ...defaultOptions, lists: [] };
		} else {
			config = json;
		}

		return [file, config, null];
	};

	const getUserLists = async (config: Config, fp: string) => {
		const { lists, ...options } = config;
		const user = new TL(options);

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
				process.exit(0);
			}
		}
	};

	const getListTimeline = async (
		list_id: string,
		{ backward }: { backward: boolean } = { backward: false }
	): Promise<number> => {
		const user = new TL(config);
		const params = createGetListTimelineParams(list_id, backward, 200);

		try {
			const data: Tweet[] = await user.get("lists/statuses", params);
			const converted = data.map((t) => {
				const full_text = convertToCorrectWidthText(t.full_text);
				const name = convertToCorrectWidthText(t.user.name);
				let tweet: Tweet = {
					...t,
					full_text,
					user: { ...t.user, name },
				};

				if (t.retweeted_status) {
					const rt = t.retweeted_status;
					const rt_full_text = convertToCorrectWidthText(rt.full_text);
					const rt_user_name = convertToCorrectWidthText(rt.user.name);
					tweet.retweeted_status = {
						...rt,
						full_text: rt_full_text,
						user: { ...rt.user, name: rt_user_name },
					};
				}
				return tweet;
			});
			setCurrentTimeline((prev) =>
				backward ? converted.slice(0, -1).concat(data) : data.concat(converted)
			);
			return data.length;
		} catch (error) {
			console.log(error);
			return 0;
		}
	};

	const createGetListTimelineParams = (
		list_id: string,
		backward: boolean,
		count: number = 200
	): GetListTimelineParams => {
		const params: GetListTimelineParams = {
			tweet_mode: "extended",
			include_entities: true,
			list_id,
			count,
		};
		if (!currentTimeline.length) return params;
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
		const user = new TL(config);
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

			const res = await user.get("statuses/show", {
				id: id_str,
				trim_user: false,
				include_my_retweet: true,
				tweet_mode: "extended",
				include_entities: true,
			});
			setCurrentTimeline((prev) =>
				prev.map((t) => (t.id_str === id_str ? res : t))
			);

			return res;
		} catch (error) {
			return null;
		}
	};

	const handleRetweet = () => {};

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
		await getListTimeline(value.id_str);
		setCurrentList(value);
		setStatus("timeline");
	};

	const handleUpdate = async (backward: boolean): Promise<number> => {
		return await getListTimeline(currentList.id_str, { backward });
	};

	return (
		<Box flexDirection="column" height={rows} paddingTop={2}>
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
					<Text>
						list-name:<Text color="green">{currentList.name}</Text>
					</Text>
					<Timeline
						timeline={currentTimeline}
						onUpdate={handleUpdate}
						onFav={handleFavorite}
					/>
				</>
			)}
		</Box>
	);
};

const DISPLAY_TWEETS_COUNT = 5;

const Timeline = ({
	timeline,
	onUpdate,
	onFav,
}: {
	timeline: Tweet[];
	onUpdate: (backward: boolean) => Promise<number>;
	onFav: (t: Tweet) => Promise<Tweet | null>;
}) => {
	const [cursor, setCursor] = useState(0);
	const [focus, setFocus] = useState(0);
	const [displayTimeline, setDisplayTimeline] = useState<Tweet[]>(
		timeline.slice(0, DISPLAY_TWEETS_COUNT)
	);
	const [fetching, setFetching] = useState(false);
	const [isBackward, setIsBackward] = useState(false);

	const update = async (backward: boolean): Promise<number> => {
		setIsBackward(backward);
		setFetching(true);
		const len = await onUpdate(backward);
		if (!backward) setCursor(cursor + len);
		setFetching(false);
		return len;
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

	useInput((input, key) => {
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
		} else if (input === "f") {
			fav();
		}
	}, {});

	return (
		<>
			<Text>
				cursor:{cursor} focus:{focus} len:{timeline.length}
			</Text>
			{fetching && (
				<Text>
					<Text color="green">
						<Spinner type="aesthetic" />
					</Text>
					<Text>{" Fetching..."}</Text>
				</Text>
			)}
			{displayTimeline.map((t, i) => (
				<TweetBox key={i} tweet={t} isFocused={focus === i} />
			))}
		</>
	);
};

const TweetBox = ({
	tweet,
	isFocused,
}: {
	tweet: Tweet;
	isFocused: boolean;
}) => {
	const t = tweet.retweeted_status ?? tweet;
	const ago = getDisplayTimeAgo(
		tweet.retweeted_status
			? tweet.retweeted_status.created_at
			: tweet.created_at
	);

	return (
		<Box
			flexDirection="column"
			borderStyle={isFocused ? "singleDouble" : "single"}
			borderColor={isFocused ? "white" : "gray"}
		>
			{tweet.retweeted_status && (
				<Text dimColor>
					🔄 {tweet.user.name}
					{tweet.user.protected && "🔒"} RT
				</Text>
			)}
			<Text>
				<Text color={tweet.retweeted_status ? "greenBright" : "#00acee"}>
					{`${t.user.name} @${t.user.screen_name} `}
					{t.user.protected && "🔒 "}
				</Text>
				<Text dimColor>{ago}</Text>
			</Text>
			<Text>
				{t.full_text}
				{tweet.entities.media && <Text dimColor> (with Media)</Text>}
			</Text>
			{isFocused && (
				<Box>
					<Box marginRight={2}>
						<Text>{t.retweet_count ? t.retweet_count + " " : ""}</Text>
						<Text color={t.retweeted ? "green" : "white"}>RT</Text>
					</Box>
					<Box marginRight={2}>
						<Text>{t.favorite_count ? t.favorite_count + " " : ""}</Text>
						<Text color={t.favorited ? "yellow" : "white"}>fav</Text>
					</Box>
				</Box>
			)}
		</Box>
	);
};

Hello.propTypes = {
	/// Name of the person to greet
	name: PropTypes.string,
};

export default Hello;
