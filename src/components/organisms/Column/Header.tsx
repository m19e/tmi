import React, { useMemo } from "react";
import type { VFC } from "react";
import { Box, Text } from "ink";
import { TabsWithInput, Tab } from "../../InkTab";
import { useColumnMap, useCurrentColumn, useHint } from "../../../hooks";
import { usePosition as useListPosition } from "../../../hooks/list";
import { usePosition as useSearchPosition } from "../../../hooks/search";

export const ColumnHeader: VFC = () => {
	const [columns] = useColumnMap();
	const [currentColumn, { setColumnKey }] = useCurrentColumn();
	const [{ key: hintKey }] = useHint();
	const [, { cachePosition: cacheListPosition }] = useListPosition();
	const [, { cachePosition: cacheSearchPosition }] = useSearchPosition();
	const canToggleColumn = useMemo(
		() => hintKey === "timeline" || hintKey === "search/timeline",
		[hintKey]
	);

	const handleTabsChange = (key: string) => {
		if (currentColumn.type === "list") {
			cacheListPosition();
		} else if (currentColumn.type === "search") {
			cacheSearchPosition();
		}
		setColumnKey(key);
	};

	return (
		<Box flexDirection="column" paddingBottom={1}>
			{/* <Text>
				{JSON.stringify(
					[...columns.values()].map((c) => {
						if (c.type === "list" || c.type === "search") {
							const { timeline, cursor, focus, ...filtered } = c;
							return {
								...filtered,
								tl: timeline.slice(0, 2).map((t) => t.user.screen_name),
							};
						}
						return c;
					})
				)}
			</Text> */}
			<TabsWithInput
				onChange={handleTabsChange}
				isFocused={canToggleColumn}
				keyMap={{ useTab: false, useNumbers: true }}
				defaultValue={currentColumn.name}
			>
				{[...columns.entries()].map(([key, column]) => (
					<Tab key={key} name={key}>
						{column.type === "search" ? (
							<>{`"${column.query}"`}</>
						) : (
							<>{column.name}</>
						)}
					</Tab>
				))}
			</TabsWithInput>
		</Box>
	);
};
