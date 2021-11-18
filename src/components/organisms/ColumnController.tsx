import React, { useState, useEffect } from "react";
import type { VFC } from "react";
import { writeJSON } from "fs-extra";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import type { Column } from "../../types";
import type { TrimmedList } from "../../types/twitter";
import SelectInput, { Item } from "../molecules/SelectInput";
import SelectList from "../molecules/SelectList";
import { useColumnMap, useUserConfig, useCurrentColumn } from "../../hooks";
import { useApi } from "../../hooks/api";

type Action = "add" | "sort" | "remove";
type ColumnType = "home" | "mentions" | "list" | "search";

const Chevron = () => <Text color="gray">{" > "}</Text>;

const SearchInput = ({ onSubmit }: { onSubmit: (q: string) => void }) => {
	const [query, setQuery] = useState("");
	useEffect(() => {
		return () => setQuery("");
	}, []);
	return (
		<TextInput
			value={query}
			onChange={setQuery}
			onSubmit={onSubmit}
			placeholder="Search word"
		/>
	);
};

export const ColumnController: VFC<{ onBack: () => void }> = ({ onBack }) => {
	const [columns, columnsAction] = useColumnMap();
	const [config] = useUserConfig();
	const [, { setColumnKey }] = useCurrentColumn();
	const api = useApi();
	const [status, setStatus] = useState<
		"actions" | "add" | "remove" | "list" | "search"
	>("actions");
	const [addItems, setAddItems] = useState<Array<Item<ColumnType>>>([]);
	const [removeItems, setRemoveItems] = useState<Array<Item<Column>>>([]);
	const [lists, setLists] = useState<TrimmedList[]>([]);

	const actionItems: Array<Item<Action>> = [
		{ key: "add", label: "Add", value: "add" },
		{ key: "sort", label: "Sort", value: "sort" },
		{ key: "remove", label: "Remove", value: "remove" },
	];

	const filterAddColumns = () => {
		const columnValues = [...columns.values()];
		let selectColumns: Array<Item<ColumnType>> = [
			{ key: "home", label: "Home", value: "home" },
			{ key: "mentions", label: "Mentions", value: "mentions" },
			{ key: "list", label: "List", value: "list" },
			{ key: "search", label: "Search", value: "search" },
		];
		if (columnValues.some((c) => c.type === "home")) {
			selectColumns = selectColumns.filter((c) => c.value !== "home");
		}
		if (columnValues.some((c) => c.type === "mentions")) {
			selectColumns = selectColumns.filter((c) => c.value !== "mentions");
		}
		return selectColumns;
	};

	const getUserLists = async () => {
		const res = await api.getLists();
		// onError
		if (!Array.isArray(res)) {
			// setError(res.message);
			if (res.rateLimit && config.lists.length) {
				setLists(config.lists);
				setStatus("list");
			}
			return;
		}
		if (!res.length) {
			// setError("Empty: GET lists/list");
			// exit();
			return;
		}
		const trim: TrimmedList[] = res.map(({ id_str, name, user, mode }) => ({
			id_str,
			owner: {
				id_str: user.id_str,
				screen_name: user.screen_name,
				name: user.name,
			},
			name,
			mode,
		}));
		await writeJSON(config.filePath, { ...config, lists: trim });
		setLists(trim);
		setStatus("list");
	};

	const handleSelectActions = ({ value }: Item<Action>) => {
		if (value === "add") {
			setAddItems(() => filterAddColumns());
			setStatus("add");
		}
	};

	const handleSelectAddColumn = async ({ value }: Item<ColumnType>) => {
		if (value === "home") {
		} else if (value === "mentions") {
		} else if (value === "list") {
			await getUserLists();
		} else if (value === "search") {
			setStatus("search");
		}
	};

	const handleSelectList = ({ value }: Item<TrimmedList>) => {
		const { id_str, name, owner } = value;
		const key = `@${owner.screen_name}/${name}`;

		if (!columns.has(key)) {
			columnsAction.set(key, {
				type: "list",
				name: key,
				list_id: id_str,
				timeline: [],
				cursor: 0,
				focus: 0,
			});
		}
		onBack();
	};

	const handleSearchSubmit = (q: string) => {
		const query = q.trim();
		if (!query) return;
		const uniqueId =
			new Date().getTime().toString(16) +
			Math.floor(Math.random() * 10).toString(16);
		const key = `Search:${uniqueId}`;
		columnsAction.set(key, {
			type: "search",
			name: key,
			query,
			timeline: [],
			cursor: 0,
			focus: 0,
		});
		onBack();
	};

	if (status === "actions") {
		return (
			<>
				<Box flexDirection="column" marginBottom={1}>
					<Text color="#00acee">Column Actions</Text>
				</Box>
				<SelectInput items={actionItems} onSelect={handleSelectActions} />
			</>
		);
	}
	if (status === "add") {
		return (
			<>
				<Box flexDirection="column" marginBottom={1}>
					<Text color="#00acee">
						Column Actions
						<Chevron />
						Add
					</Text>
				</Box>
				<SelectInput items={addItems} onSelect={handleSelectAddColumn} />
			</>
		);
	}
	if (status === "list") {
		return (
			<>
				<Box flexDirection="column" marginBottom={1}>
					<Text color="#00acee">
						Column Actions
						<Chevron />
						Add
						<Chevron />
						List
					</Text>
				</Box>
				<SelectList lists={lists} onSelect={handleSelectList} />
			</>
		);
	}
	if (status === "search") {
		return (
			<>
				<Box flexDirection="column" marginBottom={1}>
					<Text color="#00acee">
						Column Actions
						<Chevron />
						Add
						<Chevron />
						Search
					</Text>
				</Box>
				<SearchInput onSubmit={handleSearchSubmit} />
			</>
		);
	}
};
