import React from "react";
import { useCurrentColumn } from "../../hooks";
import { List } from "./List";
import { HomeProvider } from "./Provider/Home";
import { MentionsProvider } from "./Provider/Mentions";

export const ColumnSwitcher = () => {
	const [{ type }] = useCurrentColumn();

	switch (type) {
		case "home":
			return <HomeProvider />;
		case "mentions":
			return <MentionsProvider />;
		case "list":
			return <List />;
		default:
			return null;
	}
};
