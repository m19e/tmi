import React from "react";
import type { VFC } from "react";
import { Box, Text } from "ink";
import { TabsWithInput, Tab } from "../components/InkTab";
import { useColumnMap, useCurrentColumn } from "../hooks";

export const Columns: VFC = () => {
	const [columns] = useColumnMap();
	const [currentColumn, setColumnKey] = useCurrentColumn();
	const handleTabsChange = (key: string) => setColumnKey(key);
	const canToggleColumn = true;

	return (
		<Box flexDirection="column">
			<Text>Current column: {currentColumn.name}</Text>
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
		</Box>
	);
};
