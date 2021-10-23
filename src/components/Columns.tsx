import React from "react";
import type { VFC } from "react";
import { Tabs, Tab } from "ink-tab";
import { useColumnMap } from "../hooks";

export const Columns: VFC = () => {
	const [columns] = useColumnMap();
	const handleTabsChange = (key: string) => {};

	return (
		<Tabs onChange={handleTabsChange}>
			{[...columns.entries()].map(([key, column]) => (
				<Tab key={key} name={key}>
					{column.name}
				</Tab>
			))}
		</Tabs>
	);
};
