import React from "react";
import type { VFC } from "react";
import { TabsWithInput, Tab } from "../components/InkTab";
import { useColumnMap, useCurrentColumn } from "../hooks";

export const Columns: VFC = () => {
	const [columns] = useColumnMap();
	const [, setColumnKey] = useCurrentColumn();
	const handleTabsChange = (key: string) => setColumnKey(key);
	const canToggleColumn = true;

	return (
		<TabsWithInput
			onChange={handleTabsChange}
			isFocused={canToggleColumn}
			keyMap={{ useTab: false, useNumbers: true }}
		>
			{[...columns.entries()].map(([key, column]) => (
				<Tab key={key} name={key}>
					{column.name}
				</Tab>
			))}
		</TabsWithInput>
	);
};
