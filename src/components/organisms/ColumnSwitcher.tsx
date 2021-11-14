import React from "react";
import { useCurrentColumn } from "../../hooks";
import { HomeProvider } from "./Provider/Home";
import { MentionsProvider } from "./Provider/Mentions";
import { ListProvider } from "./Provider/List";
import { SearchProvider } from "./Provider/Search";

export const ColumnSwitcher = () => {
	const [column] = useCurrentColumn();

	switch (column.type) {
		case "home":
			return <HomeProvider />;
		case "mentions":
			return <MentionsProvider />;
		case "list":
			return <ListProvider />;
		case "search":
			return <SearchProvider />;
		default:
			return null;
	}
};
