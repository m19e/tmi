import React, { useState, useEffect } from "react";
import type { VFC } from "react";
import { writeJson } from "fs-extra";
import { Text, Box, useApp } from "ink";
import useDimensions from "ink-use-stdout-dimensions";

import type { AppConfig, UserConfig, GetListTweetsParams } from "../../types";
import type { Tweet, TrimmedList } from "../../types/twitter";
import { convertTweetToDisplayable } from "../../lib";
import {
	useApi,
	useError,
	useRequestResult,
	useHint,
	useTimeline,
	getFocusedPosition,
	useCursorIndex,
	useFocusIndex,
	useDisplayTweetsCount,
} from "../../hooks";
import {
	useTwitterApi,
	useUserConfig,
	useCurrentList,
	setListTimeline,
} from "../../hooks/v2";
import Timeline from "../../components/templates/Timeline";
import { Timeline as TimelineV2 } from "../../components/templates/TimelineV2";
import Footer from "../../components/organisms/Footer";
import SelectList from "../../components/molecules/SelectList";

const List: VFC<{
	filePath: string;
	config: AppConfig;
}> = ({ filePath, config }) => {
	const { exit } = useApp();
	const [, rows] = useDimensions();

	const api = useApi();
	const [, setError] = useError();
	const [, setRequestResult] = useRequestResult();
	const [, setHintKey] = useHint();
	const [timeline, setTimeline] = useTimeline();
	const { position, total } = getFocusedPosition();
	const [cursor, setCursor] = useCursorIndex();
	const [, setFocus] = useFocusIndex();
	const [count] = useDisplayTweetsCount();

	const [status, setStatus] = useState<"load" | "select" | "timeline">("load");
	const [lists, setLists] = useState<TrimmedList[]>([]);
	const [currentList, setCurrentList] = useState<TrimmedList | null>(null);

	useEffect(() => {
		getUserLists();
	}, []);

	const getUserLists = async () => {
		const res = await api.getUserLists();
		// onError
		if (!Array.isArray(res)) {
			setError(res.message);
			if (res.rate_limit && config.lists.length) {
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
		const trim: TrimmedList[] = res.map((l) => ({
			id_str: l.id_str,
			name: l.name,
			mode: l.mode,
		}));
		await writeJson(filePath, { ...config, lists: trim });
		setLists(trim);
		setStatus("select");
	};

	const createGetListTimelineParams = ({
		list_id,
		count,
		backward,
		select,
	}: {
		list_id: string;
		count: number;
		backward: boolean;
		select: boolean;
	}): GetListTweetsParams => {
		const params: GetListTweetsParams = {
			list_id,
			count,
			tweet_mode: "extended",
			include_entities: true,
		};
		if (select) return params;
		if (backward) {
			const oldest = timeline.slice(-1)[0];
			return { ...params, max_id: oldest.id_str };
		}
		const newest = timeline[0];
		return { ...params, since_id: newest.id_str };
	};

	const getListTimeline = async (
		list_id: string,
		options: { backward: boolean; select: boolean }
	): Promise<Tweet[]> => {
		const params = createGetListTimelineParams({
			list_id,
			count: 200,
			...options,
		});

		const res = await api.getListTimeline(params);
		if (!Array.isArray(res) || res.length === 0) return [];

		return res.map(convertTweetToDisplayable);
	};

	const handleSelect = async ({ value }: { value: TrimmedList }) => {
		if (currentList === null || currentList.id_str !== value.id_str) {
			const res = await getListTimeline(value.id_str, {
				backward: false,
				select: true,
			});
			setTimeline(res);
			setCurrentList(value);
		}
		setStatus("timeline");
		setHintKey("timeline");
	};

	const handleToggleList = () => {
		setStatus("select");
		setRequestResult(undefined);
		setCursor(0);
		setFocus(0);
	};

	const handleUpdate = async (backward: boolean): Promise<Tweet[]> =>
		await getListTimeline(currentList.id_str, {
			backward,
			select: false,
		});

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
							{/* <Box
								justifyContent="center"
								borderStyle="double"
								borderColor="gray"
							>
								<Text>
									[LIST]<Text color="green">{currentList.name}</Text>(
									{cursor + 1}-{cursor + count}/{total})
								</Text>
							</Box> */}
							<Timeline
								onToggleList={handleToggleList}
								onUpdate={handleUpdate}
							/>
							<Footer />
						</>
					);
				}
			})()}
		</Box>
	);
};

export const ListV2: VFC<{
	onSaveConfig: (c: UserConfig) => Promise<void>;
}> = ({ onSaveConfig }) => {
	const { exit } = useApp();
	const [, rows] = useDimensions();

	const [, setError] = useError();
	const [, setRequestResult] = useRequestResult();
	const [, setHintKey] = useHint();
	const { position, total } = getFocusedPosition();
	const [cursor, setCursor] = useCursorIndex();
	const [, setFocus] = useFocusIndex();
	const [count] = useDisplayTweetsCount();

	const [status, setStatus] = useState<"load" | "select" | "timeline">("load");
	const [lists, setLists] = useState<TrimmedList[]>([]);

	const api = useTwitterApi();
	const [config] = useUserConfig();
	const [currentList, setCurrentList] = useCurrentList();
	const setTimeline = setListTimeline();

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
		const trim: TrimmedList[] = res.map((l) => ({
			id_str: l.id_str,
			name: l.name,
			mode: l.mode,
		}));
		await onSaveConfig({ ...config, lists: trim });
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
		if (!Array.isArray(res) || res.length === 0) {
			if (!Array.isArray(res)) setError(res.message);
			return;
		}
		setTimeline(res);
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
							<TimelineV2 onToggleList={handleToggleList} />
							<Footer />
						</>
					);
				}
			})()}
		</Box>
	);
};

export default List;
