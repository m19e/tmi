import React, { useState } from "react";
import type { VFC } from "react";
import { Text } from "ink";
import SelectInput, { Item } from "../molecules/SelectInput";
import { useColumnMap, useCurrentColumn } from "../../hooks";

type Action = "add" | "sort" | "delete";
type ColumnType = "home" | "mentions" | "list";

export const ColumnController: VFC = () => {
	const [columnMap] = useColumnMap();
	const [status, setStatus] = useState<"actions" | "add" | "list">("actions");
	const [addItems, setAddItems] = useState<Array<Item<ColumnType>>>([]);

	const actionItems: Array<Item<Action>> = [
		{ key: "add", label: "Add", value: "add" },
		{ key: "sort", label: "Sort", value: "sort" },
		{ key: "delete", label: "Delete", value: "delete" },
	];

	const filterAddColumns = () => {
		const columnValues = [...columnMap.values()];
		let selectColumns: Array<Item<ColumnType>> = [
			{ key: "home", label: "Home", value: "home" },
			{ key: "mentions", label: "Mentions", value: "mentions" },
			{ key: "list", label: "List", value: "list" },
		];
		if (columnValues.some((c) => c.type === "home")) {
			selectColumns = selectColumns.filter((c) => c.value !== "home");
		}
		if (columnValues.some((c) => c.type === "mentions")) {
			selectColumns = selectColumns.filter((c) => c.value !== "mentions");
		}
		return selectColumns;
	};

	const handleSelectActions = ({ value }: Item<Action>) => {
		if (value === "add") {
			setAddItems(() => filterAddColumns());
			setStatus("add");
		}
	};

	const handleSelectAddColumn = ({ value }: Item<ColumnType>) => {
		if (value === "home") {
		}
		if (value === "mentions") {
		}
		if (value === "list") {
			setStatus("list");
		}
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
};
