import React from "react";
import type { VFC } from "react";
import { Box, Text } from "ink";
import { Tabs, Tab } from "ink-tab";
import { useColumnMap, useCurrentColumn } from "../hooks";

export const Columns: VFC = () => {
	const [columns] = useColumnMap();
	const [currentColumn, setColumnKey] = useCurrentColumn();
	const handleTabsChange = (key: string) => setColumnKey(key);
	const canToggleColumn = true;

	return (
		<Box flexDirection="column">
			<Text>Current column: {currentColumn.name}</Text>
			<Tabs onChange={handleTabsChange} isFocused={canToggleColumn}>
				{[...columns.entries()].map(([key, column]) => (
					<Tab key={key} name={key}>
						{column.name}
					</Tab>
				))}
			</Tabs>
		</Box>
	);
};
