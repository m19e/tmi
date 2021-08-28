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

const UNESCAPE_PATTERNS = {
	"&lt;": "<",
	"&gt;": ">",
	"&amp;": "&",
};

const unescape = (target: string) =>
	target.replace(/&(lt|gt|amp);/g, (match: string) => UNESCAPE_PATTERNS[match]);

const reg = new RegExp(
	"[" +
		// "Basic Latin"
		"\u{1}-\u{6}\u{8}-\u{c}\u{10}-\u{1f}" +
		// "Latin-1 Supplement"
		"\u{84}\u{85}\u{8c}\u{90}\u{98}\u{9b}\u{9d}-\u{9f}" +
		// "Combining Diacritical Marks"
		"\u{300}-\u{36f}" +
		// "Dingbats"
		"\u{270c}\u{270d}" +
		// "Linear B Syllabary" ~ "Early Dynastic Cuneiform"
		"\u{10000}-\u{1254f}" +
		// "Egyptian Hieroglyphs" ~ "Anatolian Hieroglyphs"
		"\u{13000}-\u{1467f}" +
		// "Bamum Supplement" ~ "Tangut Supplement"
		"\u{16800}-\u{18d8f}" +
		// "Kana Supplement" ~ "Duployan"
		"\u{1b002}-\u{1bcaf}" +
		// "Byzantine Musical Symbols" ~ "Sutton SignWriting"
		"\u{1d000}-\u{1daaf}" +
		// "Glagolitic Supplement" ~ "Enclosed Alphanumeric Supplement"
		"\u{1e000}-\u{1f003}\u{1f005}-\u{1f18d}\u{1f18f}\u{1f190}\u{1f19b}-\u{1f1e5}" +
		// "Enclosed Ideographic Supplement"
		"\u{1f260}-\u{1f265}" +
		// "Miscellaneous Symbols and Pictographs"
		"\u{1f321}-\u{1f32c}\u{1f336}\u{1f37d}\u{1f394}-\u{1f39f}\u{1f3cd}\u{1f3ce}\u{1f3d4}-\u{1f3df}\u{1f3f1}-\u{1f3f3}\u{1f3f5}-\u{1f3f7}\u{1f43f}\u{1f441}\u{1f4fe}\u{1f4fd}\u{1f53e}-\u{1f54a}\u{1f54f}\u{1f568}-\u{1f573}\u{1f576}-\u{1f579}\u{1f57b}-\u{1f58f}\u{1f591}-\u{1f594}\u{1f597}-\u{1f5a3}\u{1f5a5}-\u{1f5fa}" +
		// "Ornamental Dingbats"
		"\u{1f650}-\u{1f67f}" +
		// "Transport and Map Symbols"
		"\u{1f6c6}-\u{1f6cb}\u{1f6cd}-\u{1f6cf}\u{1f6d3}\u{1f6d4}\u{1f6d6}-\u{1f6ea}\u{1f6f0}-\u{1f6f3}\u{1f6fb}-\u{1f6fc}" +
		// "Alchemical Symbols"
		"\u{1f700}-\u{1f77f}" +
		// "Geometric Shapes Extended"
		"\u{1f780}-\u{1f7df}" +
		// "Supplemental Arrows-C"
		"\u{1f800}-\u{1f8ff}" +
		// "Supplemental Symbols and Pictographs"
		"\u{1f900}-\u{1f90c}\u{1f93b}\u{1f946}\u{1f972}\u{1f977}-\u{1f979}\u{1f9a3}\u{1f9a4}\u{1f9ab}-\u{1f9ad}\u{1f9cb}\u{1f9cc}\u{1f9}-\u{1f9}\u{1f9}-\u{1f9}" +
		// "Chess Symbols"
		"\u{1fa00}-\u{1fa6f}" +
		// "Symbols and Pictographs Extended-A"
		"\u{1fa74}\u{1fa83}-\u{1fa86}\u{1fa96}-\u{1faa8}\u{1fab0}-\u{1fab6}\u{1fac0}-\u{1fac2}\u{1fad0}-\u{1fad6}" +
		// "Symbols for Legacy Computing"
		"\u{1fb00}-\u{1fbff}" +
		// "Variation Selectors Supplement"
		"\u{e0100}-\u{e01ef}" +
		// "Variation Selectors"
		"\u{fe00}-\u{fe0f}" +
		"]",
	"u"
);

const convertToCorrectWidthText = (text: string): string => {
	if (!text.match(reg)) return unescape(text);

	return unescape(text)
		.split(/\n|\r\n|\r/)
		.map((line) =>
			splitWithGraphemes(line)
				.map((g) => {
					const arr = [...g];
					if (arr.length === 1) {
						if (/[\u{fe00}-\u{fe0f}]/u.test(g)) return "";
						if (reg.test(g)) return "☒";
						return g;
					}
					return arr.filter((c) => !reg.test(c)).join("");
				})
				.join("")
		)
		.join("\n");
};

const convertTweetToDisplayable = (t: Tweet): Tweet => {
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
};

/// Hello world command
const Tink = ({ name = "" }) => {
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

	const [error, setError] = useState("");

	const [cols, rows] = useDimensions();
	const { exit } = useApp();

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
				exit();
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
				exit();
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
			const converted = data.map((t) => convertTweetToDisplayable(t));
			setCurrentTimeline((prev) =>
				backward ? prev.slice(0, -1).concat(converted) : converted.concat(prev)
			);
			return data.length;
		} catch (err) {
			console.log(err);
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
				prev.map((t) =>
					t.id_str === id_str ? convertTweetToDisplayable(res) : t
				)
			);

			return res;
		} catch (err) {
			return null;
		}
	};

	const handleRetweet = async ({
		id_str,
		retweeted,
	}: Tweet): Promise<Tweet | null> => {
		const user = new TL(config);

		try {
			if (retweeted) {
				await user.post("statuses/retweet", {
					id: id_str,
				});
			} else {
				await user.post("statuses/unretweet", {
					id: id_str,
				});
			}

			const res = await user.get("statuses/show", {
				id: id_str,
				trim_user: false,
				include_my_retweet: true,
				tweet_mode: "extended",
				include_entities: true,
			});

			return res;
		} catch (err) {
			return null;
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
		await getListTimeline(value.id_str);
		setCurrentList(value);
		setStatus("timeline");
	};

	const handleUpdate = async (backward: boolean): Promise<number> => {
		return await getListTimeline(currentList.id_str, { backward });
	};

	return (
		<Box flexDirection="column" minHeight={rows}>
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
	onUpdate,
	onFav,
	onRT,
}: {
	timeline: Tweet[];
	onUpdate: (backward: boolean) => Promise<number>;
	onFav: (t: Tweet) => Promise<Tweet | null>;
	onRT: (t: Tweet) => Promise<Tweet | null>;
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
			<Box height={1}>
				{isFocused && (
					<>
						<Box marginRight={2}>
							<Text>{t.retweet_count ? t.retweet_count + " " : ""}</Text>
							<Text color={t.retweeted ? "green" : "white"}>RT</Text>
						</Box>
						<Box marginRight={2}>
							<Text>{t.favorite_count ? t.favorite_count + " " : ""}</Text>
							<Text color={t.favorited ? "yellow" : "white"}>fav</Text>
						</Box>
					</>
				)}
			</Box>
		</Box>
	);
};

Tink.propTypes = {
	/// Name of the person to greet
	name: PropTypes.string,
};

export default Tink;
