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
import { Text, Box } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import TL, { AccessTokenResponse, TwitterOptions } from "twitter-lite";
import { config } from "dotenv";

import { List, Tweet } from "../src/types/twitter";

config();

const defaultOptions = {
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
};

/// Hello world command
const Hello = ({ name = "" }) => {
	const client = new TL(defaultOptions);
	const [ot, setOT] = useState("");
	const [pin, setPIN] = useState("");
	const [filePath, setFilePath] = useState("");
	const [at, setAT] = useState<AccessTokenResponse | null>(null);
	const [config, setConfig] = useState<TwitterOptions>(defaultOptions);

	const [status, setStatus] = useState<"init" | "wait" | "select" | "timeline">(
		"init"
	);
	const [lists, setLists] = useState<List[]>([]);
	const [currentList, setCurrentList] = useState<List | null>(null);
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
				setConfig(conf);
				await getUserLists(conf);
				setStatus("select");
			}
		};

		init();
	}, []);

	const getConfig = (
		profile: string = ""
	): [string, TwitterOptions | null, any] => {
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

		let config: TwitterOptions;
		const json = readJsonSync(file, { throws: false });
		if (json === null) {
			if (existsSync(file)) {
				return ["", null, "CANNOT READ JSON"];
			}
			config = defaultOptions;
		} else {
			config = json;
		}

		return [file, config, null];
	};

	const getUserLists = async (options: TwitterOptions) => {
		const user = new TL(options);

		try {
			const data: List[] = await user.get("lists/list");
			setLists(data);
			setStatus("select");
		} catch (error) {
			console.error(error);
		}
	};

	const handleSubmitPinAuth = async (p: string) => {
		const token = await client.getAccessToken({
			oauth_verifier: p,
			oauth_token: ot,
		});
		setAT(token);

		const options = Object.assign(defaultOptions, {
			access_token_key: token.oauth_token,
			access_token_secret: token.oauth_token_secret,
		});

		await writeJson(filePath, options);
		await getUserLists(options);
		setConfig(options);
		setStatus("select");
	};

	const handleSelect = ({ value }: { label: string; value: List }) => {
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
			{status === "timeline" && (
				<Text>{JSON.stringify(currentList, null, 2)}</Text>
			)}
		</Box>
	);
};

Hello.propTypes = {
	/// Name of the person to greet
	name: PropTypes.string,
};

export default Hello;
