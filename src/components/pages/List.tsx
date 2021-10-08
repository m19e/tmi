import React, { useState, useEffect } from "react";
import type { VFC } from "react";
import { writeJson } from "fs-extra";
import { Text, Box, useApp } from "ink";
import useDimensions from "ink-use-stdout-dimensions";

import type { Tweet, TrimmedList } from "../../types/twitter";
import type { AppConfig, GetListTweetsParams } from "../../types";
import { convertTweetToDisplayable } from "../../lib";
import {
	useApi,
	useTimeline,
	getFocusedPosition,
	useCursorIndex,
	useFocusIndex,
	useDisplayTweetsCount,
	useError,
	useRequestResult,
	useHint,
} from "../../hooks";
import SelectList from "../../components/molecules/SelectList";
import Timeline from "../../components/Timeline";
import Footer from "../../components/organisms/Footer";

const List: VFC<{
	filePath: string;
	config: AppConfig;
}> = ({ filePath, config }) => {
	const [status, setStatus] = useState<"load" | "select" | "timeline">("load");
	const [lists, setLists] = useState<TrimmedList[]>([]);
	const [currentList, setCurrentList] = useState<TrimmedList | null>(null);
	const [timeline, setTimeline] = useTimeline();
	const { position, total } = getFocusedPosition();
	const [cursor, setCursor] = useCursorIndex();
	const [, setFocus] = useFocusIndex();
	const [count] = useDisplayTweetsCount();

	const [, setError] = useError();
	const [, setRequestResult] = useRequestResult();
	const [, setHintKey] = useHint();

	const api = useApi();
	const [, rows] = useDimensions();
	const { exit } = useApp();

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

	const handleSelect = async ({ value }: { value: TrimmedList }) => {
		if (currentList === null || currentList.id_str !== value.id_str) {
			const data = await getListTimeline(value.id_str, {
				backward: false,
				select: true,
			});
			setTimeline(data);
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

export default List;
