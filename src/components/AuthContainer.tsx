import React, { useState, useEffect } from "react";
import type { VFC } from "react";
import path from "path";
import {
	mkdirsSync,
	readdirSync,
	existsSync,
	readJsonSync,
	writeJson,
} from "fs-extra";
import { Text, useApp } from "ink";
import Twitter from "twitter-lite";
import { config } from "dotenv";
import TwitterApi from "twitter-api-v2";
import type { TwitterApiTokens } from "twitter-api-v2";

import type { AppConfig, AppConfigV2 } from "../types";
import { TrimmedList } from "../types/twitter";
import { useClient, useUserId } from "../hooks";
import { useTwitterClient } from "../hooks/v2";
import PinAuthInput from "./molecules/PinAuthInput";

config();

const defaultOptions = {
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
};

interface PageProps {
	filePath: string;
	config: AppConfig;
}

interface Props {
	page: VFC<PageProps>;
}

export const AuthContainer: VFC<Props> = ({ page: Page }) => {
	const { exit } = useApp();
	const [client, setClient] = useClient();
	const [, setUserId] = useUserId();

	const [ot, setOT] = useState("");
	const [pin, setPIN] = useState("");
	const [filePath, setFilePath] = useState("");
	const [appConfig, setAppConfig] = useState<AppConfig | undefined>(undefined);
	const [status, setStatus] = useState<"load" | "pin" | "page">("load");

	useEffect(() => {
		const init = async () => {
			const [fp, conf, err] = getConfig();
			setFilePath(fp);
			if (err !== null || !conf.access_token_key || !conf.access_token_secret) {
				if (err !== null) {
					console.error("cannot get configuration: ", err);
					exit();
				}
				const app = new Twitter(defaultOptions);
				const rt = await app.getRequestToken("oob");
				const { oauth_token } = rt as {
					oauth_token: string;
				};
				setClient(app);
				setOT(oauth_token);
				setStatus("pin");
			} else {
				setClient(new Twitter(conf));
				setAppConfig(conf);
				setUserId(conf.user_id);
				setStatus("page");
			}
		};

		init();
	}, []);

	const getConfig = (profile: string = ""): [string, AppConfig | null, any] => {
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

		let conf: AppConfig;
		const json = readJsonSync(file, { throws: false });
		if (json === null) {
			if (existsSync(file)) {
				return ["", null, "CANNOT READ JSON"];
			}
			conf = { ...defaultOptions, user_id: "", lists: [] };
		} else {
			conf = json;
		}

		return [file, conf, null];
	};

	const handleSubmitPinAuth = async (p: string) => {
		const token = await client.getAccessToken({
			oauth_verifier: p,
			oauth_token: ot,
		});

		const conf: AppConfig = {
			...defaultOptions,
			access_token_key: token.oauth_token,
			access_token_secret: token.oauth_token_secret,
			user_id: token.user_id,
			lists: [],
		};

		setClient(new Twitter(conf));
		setAppConfig(conf);
		setStatus("page");
	};

	if (status === "load") {
		return <Text>Loading...</Text>;
	}
	if (status === "pin") {
		return (
			<PinAuthInput
				url={`https://api.twitter.com/oauth/authenticate?oauth_token=${ot}`}
				value={pin}
				onChange={setPIN}
				onSubmit={handleSubmitPinAuth}
			/>
		);
	}
	if (status === "page") {
		return <Page filePath={filePath} config={appConfig} />;
	}
};

const defaultTokens: TwitterApiTokens = {
	appKey: process.env.TWITTER_CONSUMER_KEY,
	appSecret: process.env.TWITTER_CONSUMER_SECRET,
};

interface PagePropsV2 {
	config: AppConfigV2;
	onSaveConfig: (c: AppConfigV2) => Promise<void>;
}

interface PropsV2 {
	page: VFC<PagePropsV2>;
}

export const AuthContainerV2: VFC<PropsV2> = ({ page: Page }) => {
	const { exit } = useApp();
	const [, setUserId] = useUserId();

	const [pin, setPIN] = useState("");
	const [filePath, setFilePath] = useState("");
	const [status, setStatus] = useState<"load" | "pin" | "page">("load");

	const [, setTwitterClient] = useTwitterClient();
	const [twitterConfig, setTwitterConfig] = useState<AppConfigV2>({
		...defaultTokens,
		userId: "",
		lists: [],
	});
	const [authLink, setAuthLink] = useState<{
		oauth_token: string;
		oauth_token_secret: string;
		oauth_callback_confirmed: "true";
		url: string;
	}>();

	useEffect(() => {
		const initV2 = async () => {
			const [fp, conf, err] = getConfigV2();
			setFilePath(fp);
			if (err !== null || !conf.accessToken || !conf.accessSecret) {
				if (err !== null) {
					console.error("cannot get configuration: ", err);
					exit();
				}
				const initClient = new TwitterApi(defaultTokens);
				const link = await initClient.generateAuthLink("oob");
				setAuthLink(link);
				setStatus("pin");
			} else {
				setTwitterClient(new TwitterApi(conf));
				setTwitterConfig(conf);
				setUserId(conf.userId);
				setStatus("page");
			}
		};
		initV2();
	}, []);

	const getConfigV2 = (
		profile: string = ""
	): [string, AppConfigV2 | null, any] => {
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

		let conf: AppConfigV2;
		const json = readJsonSync(file, { throws: false });
		if (json === null) {
			if (existsSync(file)) {
				return ["", null, "CANNOT READ JSON"];
			}
			conf = { ...defaultTokens, userId: "", lists: [] };
		} else {
			conf = json;
		}

		return [file, conf, null];
	};

	const handleSubmitV2 = async (p: string) => {
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
		setTwitterConfig({
			...defaultTokens,
			accessToken,
			accessSecret,
			userId,
			lists: [],
		});
		setUserId(userId);
		setStatus("page");
	};

	const handleSaveConfig = async (conf: AppConfigV2) =>
		await writeJson(filePath, conf);

	if (status === "load") {
		return <Text>Loading...</Text>;
	}
	if (status === "pin") {
		return (
			<PinAuthInput
				url={authLink.url}
				value={pin}
				onChange={setPIN}
				onSubmit={handleSubmitV2}
			/>
		);
	}
	if (status === "page") {
		return <Page config={twitterConfig} onSaveConfig={handleSaveConfig} />;
	}
};
