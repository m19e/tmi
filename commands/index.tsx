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
import TL, { AccessTokenResponse, TwitterOptions } from "twitter-lite";
import { config } from "dotenv";

import { Tweet } from "../src/types/twitter";

config();

const defaultOptions = {
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
};

/// Hello world command
const Hello = ({ name = "" }) => {
	const client = new TL(defaultOptions);

	const [status, setStatus] = useState<"init" | "wait" | "done">("init");
	const [ot, setOT] = useState("");
	const [pin, setPIN] = useState("");
	const [filePath, setFilePath] = useState("");

	const [at, setAT] = useState<AccessTokenResponse | null>(null);
	const [config, setConfig] = useState<TwitterOptions>(defaultOptions);

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
				await getPrivateFriendTimeline(conf);
				setStatus("done");
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

	const getPrivateFriendTimeline = async (options: TwitterOptions) => {
		const user = new TL(options);

		const data: Tweet[] = await user.get("statuses/user_timeline", {
			screen_name: name,
			count: 3,
		});
		console.log(
			JSON.stringify(
				data.map((t) => [
					t.created_at,
					`${t.user.name} @${t.user.screen_name}`,
					t.text,
				]),
				null,
				2
			)
		);
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
		await getPrivateFriendTimeline(options);
		setStatus("done");
	};

	return (
		<Box flexDirection="column">
			<Text>Open URL and enter PIN.</Text>
			{status === "done" ? (
				<Text>
					https://api.twitter.com/oauth/authenticate?oauth_token=
					<Text color="red">
						{ot
							.split("")
							.map(() => "*")
							.join("")}
					</Text>
					<Text dimColor> (masked)</Text>
				</Text>
			) : (
				<Text>
					{"https://api.twitter.com/oauth/authenticate?oauth_token=" + ot}
				</Text>
			)}
			{status === "wait" && (
				<Box>
					<Text>PIN: </Text>
					<TextInput
						value={pin}
						onChange={(value) => setPIN(value)}
						onSubmit={handleSubmitPinAuth}
					/>
				</Box>
			)}
			{status === "done" && (
				<>
					<Box>
						<Text>
							PIN:{" "}
							<Text color="red">
								{pin
									.split("")
									.map(() => "*")
									.join("")}
							</Text>
							<Text dimColor> (masked)</Text>
						</Text>
					</Box>
					<Text>
						{at &&
							JSON.stringify(
								Object.assign(at, {
									oauth_token:
										at.oauth_token
											.split("")
											.map(() => "*")
											.join("") + " (masked)",
									oauth_token_secret:
										at.oauth_token_secret
											.split("")
											.map(() => "*")
											.join("") + " (masked)",
								}),
								null,
								2
							)}
					</Text>
				</>
			)}
		</Box>
	);
};

Hello.propTypes = {
	/// Name of the person to greet
	name: PropTypes.string,
};

export default Hello;
