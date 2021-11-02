import React from "react";
import { useCurrentColumn } from "../../hooks";
import { List } from "./List";
import { HomeTimeline as Home } from "./Timeline/Home";
import { MentionsTimeline as Mentions } from "./Timeline/Mentions";

export const ColumnSwitcher = () => {
	const [{ type }] = useCurrentColumn();

	switch (type) {
		case "home":
			return <Home />;
		case "mentions":
			return <Mentions />;
		case "list":
			return <List />;
		default:
			return null;
	}
};
