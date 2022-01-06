import React from "react";
import { Box, Text } from "ink";
import type { ListV1 } from "twitter-api-v2";
import SelectInput from "./SelectInput";
import type { Item } from "./SelectInput";

interface Props {
	lists: ListV1[];
	onSelect: (item: { value: ListV1 }) => void;
}

const ItemComponent = ({
	isSelected = false,
	label,
}: {
	isSelected?: boolean;
	label: string;
}) => (
	<Box marginBottom={1}>
		<Text color={isSelected ? "#00acee" : undefined}>{label}</Text>
	</Box>
);

const SelectManageList = ({ lists, onSelect }: Props) => {
	const items: Item<ListV1>[] = lists.map((list) => ({
		key: list.id_str,
		label: list.name + (list.mode === "private" ? " 🔒" : ""),
		value: list,
	}));

	return (
		<SelectInput
			items={items}
			onSelect={onSelect}
			itemComponent={ItemComponent}
		/>
	);
};

export const ListMemberManage = ({ lists, onSelect }: Props) => {
	return (
		<>
			<Box marginBottom={1}>
				<Text>Pick a List</Text>
			</Box>
			<SelectManageList lists={lists} onSelect={onSelect} />
		</>
	);
};
