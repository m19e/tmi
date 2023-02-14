import React, { useState, useEffect } from "react";
import type { VFC, ReactNode } from "react";
import path from "path";
import { writeJSON } from "fs-extra";
import { mkdirsSync, readdirSync, existsSync, readJsonSync } from "fs-extra";
import { Text, useApp } from "ink";
import { config } from "dotenv";
import TwitterApi from "twitter-api-v2";
import type { TwitterApiTokens } from "twitter-api-v2";

import type { UserConfig } from "../../types";
import { useTwitterClient, useUserConfig } from "../../hooks";
import PinAuthInput from "../molecules/PinAuthInput";

config();

const defaultTokens: TwitterApiTokens = {
	appKey: process.env.TWITTER_CONSUMER_KEY,
	appSecret: process.env.TWITTER_CONSUMER_SECRET,
};

interface Props {
	children: ReactNode;
}

export const AuthContainer: VFC<Props> = ({ children }) => {
	const { exit } = useApp();
	const [, setTwitterClient] = useTwitterClient();
	const [, setUserConfig] = useUserConfig();

	const [pin, setPIN] = useState("");
	const [filePath, setFilePath] = useState("");
	const [status, setStatus] = useState<"load" | "pin" | "page">("load");
	const [authLink, setAuthLink] = useState<{
		oauth_token: string;
		oauth_token_secret: string;
		oauth_callback_confirmed: "true";
		url: string;
	}>();

	useEffect(() => {
		const init = async () => {
			const [fp, conf, err] = getConfig();
			if (err !== null || !conf.accessToken || !conf.accessSecret) {
				if (err !== null) {
					console.error("cannot get configuration: ", err);
					exit();
				}
				const initClient = new TwitterApi(defaultTokens);
				const link = await initClient.generateAuthLink("oob");
				setAuthLink(link);
				setFilePath(fp);
				setStatus("pin");
			} else {
				setTwitterClient(new TwitterApi(conf));
				setUserConfig(conf);
				setStatus("page");
			}
		};
		init();
	}, []);

	const getConfig = (
		profile: string = ""
	): [string, UserConfig | null, any] => {
		let dir = process.env.HOME ?? "";
		if (dir === "" && process.platform === "win32") {
			dir = process.env.APPDATA ?? "";
			if (dir === "") {
				dir = path.join(
					process.env.USERPROFILE ?? "",
					"Application Data",
					"tmi"
				);
			}
		} else {
			dir = path.join(dir, ".config", "tmi");
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

		let conf: UserConfig;
		const json = readJsonSync(file, { throws: false });
		if (json === null) {
			if (existsSync(file)) {
				return ["", null, "CANNOT READ JSON"];
			}
			conf = { ...defaultTokens, userId: "", lists: [], filePath: file };
		} else {
			conf = json;
		}

		return [file, conf, null];
	};

	const handleSubmit = async (p: string) => {
		const oauthClient = new TwitterApi({
			...defaultTokens,
			accessToken: authLink.oauth_token,
			accessSecret: authLink.oauth_token_secret,
		});
		const {
			client: loggedClient,
			accessToken,
			accessSecret,
			userId,
		} = await oauthClient.login(p);
		setTwitterClient(loggedClient);
		const c = {
			...defaultTokens,
			accessToken,
			accessSecret,
			userId,
			filePath,
			lists: [],
		};
		await writeJSON(filePath, c);
		setUserConfig(c);
		setStatus("page");
	};

	if (status === "load") {
		return <Text>Loading...</Text>;
	}
	if (status === "pin") {
		return (
			<PinAuthInput
				url={authLink.url}
				value={pin}
				onChange={setPIN}
				onSubmit={handleSubmit}
			/>
		);
	}
	if (status === "page") {
		return <>{children}</>;
	}
};
