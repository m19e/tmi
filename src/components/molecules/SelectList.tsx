import React from "react";
import type { VFC } from "react";
import { Box, Text } from "ink";
import SelectInput, { Item } from "ink-select-input";
import { TrimmedList } from "../../types/twitter";

interface Item<V> {
	key: string;
	label: string;
	value: V;
}

interface Props {
	lists: Array<TrimmedList>;
	onSelect: (item: Item<TrimmedList>) => void;
}

const SelectList: VFC<Props> = ({ lists, onSelect }) => {
	const items = lists.map((list) => ({
		key: list.id_str,
		label: list.name + (list.mode === "private" ? " 🔒" : ""),
		value: list,
	}));

	return (
		<Box flexDirection="column">
			<Text>Select list to display.</Text>
			<SelectInput items={items} onSelect={onSelect} />
		</Box>
	);
};

export default SelectList;
