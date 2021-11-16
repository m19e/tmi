import React, { useState } from "react";
import type { VFC } from "react";
import { writeJSON } from "fs-extra";
import { Text } from "ink";
import type { TrimmedList } from "../../types/twitter";
import SelectInput, { Item } from "../molecules/SelectInput";
import SelectList from "../molecules/SelectList";
import { useColumnMap, useUserConfig, useCurrentColumn } from "../../hooks";
import { useApi } from "../../hooks/api";

type Action = "add" | "sort" | "delete";
type ColumnType = "home" | "mentions" | "list" | "search";

export const ColumnController: VFC<{ onBack: () => void }> = ({ onBack }) => {
	const [columns, columnsAction] = useColumnMap();
	const [config] = useUserConfig();
	const [, { setColumnKey }] = useCurrentColumn();
	const api = useApi();
	const [status, setStatus] = useState<"actions" | "add" | "list">("actions");
	const [addItems, setAddItems] = useState<Array<Item<ColumnType>>>([]);
	const [lists, setLists] = useState<TrimmedList[]>([]);

	const actionItems: Array<Item<Action>> = [
		{ key: "add", label: "Add", value: "add" },
		{ key: "sort", label: "Sort", value: "sort" },
		{ key: "delete", label: "Delete", value: "delete" },
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
			const uniqueId =
				new Date().getTime().toString(16) +
				Math.floor(Math.random() * 10).toString(16);
			const key = `Search:${uniqueId}`;
			columnsAction.set(key, {
				type: "search",
				name: key,
				query: "",
				timeline: [],
				cursor: 0,
				focus: 0,
			});
			onBack();
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

	if (status === "actions") {
		return (
			<>
				<Text>Select column action...</Text>
				<SelectInput items={actionItems} onSelect={handleSelectActions} />
			</>
		);
	}
	if (status === "add") {
		return (
			<>
				<Text>Select column type...</Text>
				<SelectInput items={addItems} onSelect={handleSelectAddColumn} />
			</>
		);
	}
	if (status === "list") {
		return <SelectList lists={lists} onSelect={handleSelectList} />;
	}
};
