import React from "react";
import { Text } from "ink";
import { useCurrentColumn } from "../../hooks";
import { List } from "./List";
import { HomeTimeline as Home } from "./Timeline/Home";

export const ColumnSwitcher = () => {
	const [{ type }] = useCurrentColumn();

	switch (type) {
		case "home":
			return <Home />;
		case "mentions":
			return <Text>column: Mentions</Text>;
		case "list":
			return <List />;
		default:
			return null;
	}
};
