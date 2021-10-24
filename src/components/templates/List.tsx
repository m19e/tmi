import React, { useState, useEffect } from "react";
import type { VFC } from "react";
import { Text, Box, useApp } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import { writeJSON } from "fs-extra";

import type { GetListTweetsParams } from "../../types";
import type { TrimmedList } from "../../types/twitter";
import { useError, useRequestResult, useHint } from "../../hooks";
import {
	useTwitterApi,
	useUserConfig,
	useCurrentList,
	useListTimeline,
	useCursorIndex,
	useFocusIndex,
	useDisplayTweetsCount,
} from "../../hooks/v2";
import { Timeline } from "./Timeline";
import Footer from "../organisms/Footer";
import SelectList from "../molecules/SelectList";

export const List: VFC = () => {
	const { exit } = useApp();
	const [, rows] = useDimensions();

	const [, setError] = useError();
	const [, setRequestResult] = useRequestResult();
	const [, setHintKey] = useHint();
	const api = useTwitterApi();
	const [config] = useUserConfig();
	const [currentList, setCurrentList] = useCurrentList();
	const [{ length: total }, setTimeline] = useListTimeline();
	const [cursor, setCursor] = useCursorIndex();
	const [, setFocus] = useFocusIndex();
	const [count] = useDisplayTweetsCount();

	const [status, setStatus] = useState<"load" | "select" | "timeline">("load");
	const [lists, setLists] = useState<TrimmedList[]>([]);

	useEffect(() => {
		getUserLists();
	}, []);

	const getUserLists = async () => {
		const res = await api.getLists();
		// onError
		if (!Array.isArray(res)) {
			setError(res.message);
			if (res.rateLimit && config.lists.length) {
				setLists(config.lists);
				setStatus("select");
			} else {
				exit();
			}
			return;
		}
		// onEmpty
		if (!res.length) {
			setError("Empty: GET lists/list");
			exit();
			return;
		}
		// Valid response
		const trim: TrimmedList[] = res.map(({ id_str, name, mode }) => ({
			id_str,
			name,
			mode,
		}));
		await writeJSON(config.filePath, { ...config, lists: trim });
		setLists(trim);
		setStatus("select");
	};

	const getNewListTimeline = async (list_id: string) => {
		const params: GetListTweetsParams = {
			list_id,
			count: 200,
			tweet_mode: "extended",
			include_entities: true,
		};
		const res = await api.getListTweets(params);
		if (typeof res === "string") {
			setError(res);
			return;
		}
		if (res.length) {
			setTimeline(res);
		}
	};

	const handleSelect = async ({ value }: { value: TrimmedList }) => {
		if (!currentList || currentList.id_str !== value.id_str) {
			setCursor(0);
			setFocus(0);
			await getNewListTimeline(value.id_str);
			setCurrentList(value);
		}
		setStatus("timeline");
		setHintKey("timeline");
	};

	const handleToggleList = () => {
		setStatus("select");
		setRequestResult(undefined);
	};

	if (status === "load") {
		return <Text>Loading...</Text>;
	}
	return (
		<Box flexDirection="column" minHeight={rows}>
			{(() => {
				if (status === "select") {
					return <SelectList lists={lists} onSelect={handleSelect} />;
				}
				if (status === "timeline") {
					return (
						<>
							<Box
								justifyContent="center"
								borderStyle="double"
								borderColor="gray"
							>
								<Text>
									[LIST]<Text color="green">{currentList.name}</Text>(
									{cursor + 1}-{cursor + count}/{total})
								</Text>
							</Box>
							<Timeline onToggleList={handleToggleList} />
							<Footer />
						</>
					);
				}
			})()}
		</Box>
	);
};
