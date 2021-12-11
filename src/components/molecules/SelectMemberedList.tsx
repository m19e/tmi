import React from "react";
import type { VFC } from "react";
import type { ListV1 } from "twitter-api-v2";
import { Text, Box } from "ink";
import stc from "string-to-color";
import SelectInput, { Item } from "./SelectInput";
import figures from "../../lib/sindresorhus/figures";

interface ItemProps {
	isSelected?: boolean;
	label: string;
	value: ListV1;
}

const ItemComponent: VFC<ItemProps> = ({ value: list }) => {
	const { user, id_str, name, description } = list;
	const ownerColor = stc(user.screen_name);

	return (
		<Box key={id_str} flexDirection="column" flexGrow={1} marginBottom={1}>
			<Text>
				<Text color={ownerColor}>{name} </Text>
				<Text color="gray">by </Text>
				<Text bold>{user.name}</Text>
				{user.protected && "🔒"}
				(@{user.screen_name})
			</Text>
			<Text color="gray">{description || "*No description*"}</Text>
		</Box>
	);
};

interface IndicatorProps {
	isSelected?: boolean;
}

const IndicatorComponent: VFC<IndicatorProps> = ({ isSelected = false }) => (
	<Box flexDirection="column" width={2} height={2}>
		{isSelected && (
			<>
				<Text color="#00acee">{figures.squareLeft}</Text>
				<Text color="#00acee">{figures.squareLeft}</Text>
			</>
		)}
	</Box>
);

interface Props {
	lists: ListV1[];
	onSelect: (item: Item<ListV1>) => void;
}

export const SelectMemberedList: VFC<Props> = ({ lists, onSelect }) => {
	const items = lists.map((list) => ({
		key: list.id_str,
		label: list.name,
		value: list,
	}));

	return (
		<SelectInput
			items={items}
			onSelect={onSelect}
			itemComponent={ItemComponent}
			indicatorComponent={IndicatorComponent}
			limit={10}
		/>
	);
};
