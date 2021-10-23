import React from "react";
import type { VFC } from "react";
import { Tabs, Tab } from "ink-tab";
import { useColumnMap } from "../hooks";

export const Columns: VFC = () => {
	const [columns, actions] = useColumnMap();
	const handleTabsChange = (key: string) => {};

	return (
		<Tabs onChange={handleTabsChange}>
			{[...columns.values()].map((column) => (
				<Tab key={column.name} name={column.name}>
					{column.name}
				</Tab>
			))}
		</Tabs>
	);
};
