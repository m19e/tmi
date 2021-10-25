import React from "react";
import { Text } from "ink";
import { useCurrentColumn } from "../../hooks";
import { List } from "./List";

export const ColumnSwitcher = () => {
	const [{ type }] = useCurrentColumn();

	switch (type) {
		case "home":
			return <Text>column: Home</Text>;
		case "mentions":
			return <Text>column: Mentions</Text>;
		case "list":
			return <List />;
		default:
			return null;
	}
};
