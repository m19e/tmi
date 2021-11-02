import React from "react";
import { useCurrentColumn } from "../../hooks";
import { HomeProvider } from "./Provider/Home";
import { MentionsProvider } from "./Provider/Mentions";
import { ListProvider } from "./Provider/List";

export const ColumnSwitcher = () => {
	const [{ type }] = useCurrentColumn();

	switch (type) {
		case "home":
			return <HomeProvider />;
		case "mentions":
			return <MentionsProvider />;
		case "list":
			return <ListProvider />;
		default:
			return null;
	}
};
