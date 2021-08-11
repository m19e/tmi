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
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import TL, { TwitterOptions } from "twitter-lite";
import { config } from "dotenv";

import { Tweet, List, TrimmedList } from "../src/types/twitter";
import { getDisplayTimeAgo } from "../src/lib";

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

/// Hello world command
const Hello = ({ name = "" }) => {
	const client = new TL(defaultOptions);
	const [ot, setOT] = useState("");
	const [pin, setPIN] = useState("");
	const [filePath, setFilePath] = useState("");
	const [config, setConfig] = useState<Config>(
		Object.assign(defaultOptions, { lists: [] })
	);

	const [status, setStatus] = useState<"init" | "wait" | "select" | "timeline">(
		"init"
	);
	const [lists, setLists] = useState<TrimmedList[]>([]);
	const [currentList, setCurrentList] = useState<TrimmedList | null>(null);
	const [currentTimeline, setCurrentTimeline] = useState<Tweet[]>([]);

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
			config = Object.assign(defaultOptions, { lists: [] });
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
			await writeJson(fp, Object.assign(options, { lists: trim }));
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

	const getListTimeline = async (list_id: string) => {
		const user = new TL(config);

		try {
			const data: Tweet[] = await user.get("lists/statuses", {
				list_id,
				count: 30,
				tweet_mode: "extended",
				include_entities: true,
			});
			setCurrentTimeline(data);
		} catch (error) {
			console.log(error);
		}
	};

	const handleSubmitPinAuth = async (p: string) => {
		const token = await client.getAccessToken({
			oauth_verifier: p,
			oauth_token: ot,
		});

		const conf = Object.assign(defaultOptions, {
			access_token_key: token.oauth_token,
			access_token_secret: token.oauth_token_secret,
			lists: [],
		});

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

	return (
		<Box flexDirection="column" marginY={1}>
			{status === "wait" && (
				<>
					<Text>Open URL and enter PIN.</Text>
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
							label: l.name,
							value: l,
						}))}
						onSelect={handleSelect}
					/>
				</>
			)}
			{status === "timeline" && <Timeline timeline={currentTimeline} />}
		</Box>
	);
};

const Timeline = ({ timeline }: { timeline: Tweet[] }) => {
	const [cursor, setCursor] = useState(0);
	const [focus, setFocus] = useState(0);
	const [displayTimeline, setDisplayTimeline] = useState<Tweet[]>(
		timeline.slice(0, 5)
	);

	useInput((_, key) => {
		if (key.upArrow || (key.shift && key.tab)) {
			if (focus === 0) {
				setCursor((prev) => {
					if (prev === 0) {
						return prev;
					}
					setDisplayTimeline(timeline.slice(prev - 1, prev + 4));
					return prev - 1;
				});
			} else {
				setFocus((prev) => prev - 1);
			}
		} else if (key.downArrow || key.tab) {
			if (focus === 4) {
				setCursor((prev) => {
					if (prev === timeline.length - 1) {
						return prev;
					}
					setDisplayTimeline(timeline.slice(prev + 1, prev + 6));
					return prev + 1;
				});
			} else {
				setFocus((prev) => prev + 1);
			}
		}
	}, {});

	return (
		<>
			<Text>
				cursor:{cursor} focus:{focus}
			</Text>
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
		<Box flexDirection="column" borderStyle="single" borderColor="gray">
			{tweet.retweeted_status && (
				<Text dimColor>
					🔄 {tweet.user.name}
					{tweet.user.protected && "🔒"} RT
				</Text>
			)}
			<Box>
				<Text color="#00acee">{t.user.name}</Text>
				<Box paddingX={1}>
					<Text color="#00acee">@{t.user.screen_name}</Text>
				</Box>
				{t.user.protected && <Text>🔒</Text>}
				<Text dimColor>{ago}</Text>
			</Box>
			<Text>{t.full_text}</Text>
			{isFocused && (
				<Box>
					<Text>{t.retweet_count ? t.retweet_count + " " : ""}</Text>
					<Text color={t.retweeted ? "green" : "white"}>RT</Text>
					<Text>{"　"}</Text>
					<Text>{t.favorite_count ? t.favorite_count + " " : ""}</Text>
					<Text color={t.favorited ? "yellow" : "white"}>fav</Text>
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
