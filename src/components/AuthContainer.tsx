import React, { useState, useEffect } from "react";
import type { VFC } from "react";
import path from "path";
import { mkdirsSync, readdirSync, existsSync, readJsonSync } from "fs-extra";
import { Text, useApp } from "ink";
import Twitter from "twitter-lite";
import { config } from "dotenv";

import type { AppConfig } from "../types";
import { useClient, useUserId } from "../hooks";
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
				setFilePath(fp);
				setOT(oauth_token);
				setStatus("pin");
			} else {
				setClient(new Twitter(conf));
				setFilePath(fp);
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
				oauthToken={ot}
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
