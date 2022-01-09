import React, { useState, useEffect } from "react";
import type { VFC } from "react";
import { useApp, useInput, Text, Box } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import { writeJSON } from "fs-extra";
import type { TrimmedList } from "../../types/twitter";
import {
	useUserConfig,
	useError,
	useRequestResult,
	useHint,
} from "../../hooks";
import { useApi } from "../../hooks/api";
import {
	useCurrentList,
	usePosition,
	useSingleListPaginator,
	useListTimeline,
	useMover,
	useDisplayTweetsCount,
	getDisplayTimeline,
	getFocusedTweet,
} from "../../hooks/list";
import SelectList from "../molecules/SelectList";
import { AbstractTimeline } from "../organisms/AbstractTimeline";

export const ListSub: VFC = () => {
	const { exit } = useApp();
	const [, rows] = useDimensions();

	const [, setError] = useError();
	const [, setRequestResult] = useRequestResult();
	const [{ key: hintKey }, setHintKey] = useHint();

	const api = useApi();
	const [config] = useUserConfig();
	const [currentList] = useCurrentList();
	const [{ cursor }, { setCursor, setFocus }] = usePosition();

	const displayTimeline = getDisplayTimeline();
	const [{ length: total }, setTimeline] = useListTimeline();
	const paginator = useSingleListPaginator();
	const mover = useMover();
	const [count, countActions] = useDisplayTweetsCount();
	const focusedTweet = getFocusedTweet();

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
		const trim: TrimmedList[] = res.map(({ id_str, name, mode, user }) => ({
			id_str,
			name,
			mode,
			owner: {
				id_str: user.id_str,
				name: user.name,
				screen_name: user.screen_name,
			},
		}));
		await writeJSON(config.filePath, { ...config, lists: trim });
		setLists(trim);
		setStatus("select");
	};

	const handleSelect = async ({ value: newList }: { value: TrimmedList }) => {
		if (!currentList.id_str || currentList.id_str !== newList.id_str) {
			setStatus("load");
			setCursor(0);
			setFocus(0);
			const res = await paginator.fetch(newList);
			if (typeof res === "string") {
				setError(res);
			}
		}
		setStatus("timeline");
		setHintKey("list/timeline");
	};

	const handleToggleList = async () => {
		setStatus("load");
		await getUserLists();
		setRequestResult(undefined);
	};

	useInput(
		(input, _) => {
			if (input === "l") {
				handleToggleList();
			}
		},
		{ isActive: hintKey === "list/timeline" }
	);

	const Header = () => (
		<Box justifyContent="space-between" marginBottom={1}>
			<Text color="#00acee" bold>
				@{currentList.owner.screen_name}/{currentList.name}
			</Text>
			<Text>
				[{cursor + 1}-{cursor + count}/{total}]
			</Text>
		</Box>
	);

	if (status === "load") {
		return <Text>Loading...</Text>;
	}
	if (status === "select") {
		return (
			<Box flexDirection="column" minHeight={rows}>
				<Box marginBottom={1}>
					<Text color="#00acee">Select List</Text>
				</Box>
				<SelectList lists={lists} onSelect={handleSelect} />
			</Box>
		);
	}
	return (
		<Box flexDirection="column" minHeight={rows}>
			<Header />
			<AbstractTimeline
				type="list"
				timeline={displayTimeline}
				setTimeline={setTimeline}
				paginator={paginator}
				mover={mover}
				countActions={countActions}
				focusedTweet={focusedTweet}
			/>
		</Box>
	);
};
