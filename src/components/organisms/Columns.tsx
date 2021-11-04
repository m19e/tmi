import React, { useMemo } from "react";
import type { VFC } from "react";
import { Box } from "ink";
import { TabsWithInput, Tab } from "../InkTab";
import { useColumnMap, useCurrentColumn, useHint } from "../../hooks";
import { usePosition } from "../../hooks/list";

export const Columns: VFC = () => {
	const [columns] = useColumnMap();
	const [currentColumn, { setColumnKey }] = useCurrentColumn();
	const [{ key: hintKey }] = useHint();
	const [, { cachePosition }] = usePosition();
	const canToggleColumn = useMemo(() => hintKey === "timeline", [hintKey]);

	const handleTabsChange = (key: string) => {
		if (currentColumn.type === "list") {
			cachePosition();
		}
		setColumnKey(key);
	};

	return (
		<Box paddingBottom={1}>
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
