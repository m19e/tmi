import React from "react";
import type { VFC } from "react";
import { TabsWithInput, Tab } from "../InkTab";
import { useColumnMap, useCurrentColumn, useHint } from "../../hooks";

export const Columns: VFC = () => {
	const [columns] = useColumnMap();
	const [, setColumnKey] = useCurrentColumn();
	const [{ key: hintKey }] = useHint();
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
