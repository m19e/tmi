import type { VFC } from "react";
import { Text, Box } from "ink";
import figures from "../../lib/sindresorhus/figures";
import CustomSelectInput, {
	NoRotateSelectInput as NoRotate,
} from "./CostumSelectInput";
import type { Props } from "./CostumSelectInput";

interface ItemProps {
	isSelected?: boolean;
	label: string;
}

export interface Item<V> {
	key?: string;
	label: string;
	value: V;
}

interface IndicatorProps {
	isSelected?: boolean;
}

const DefaultItemComponent: VFC<ItemProps> = ({
	isSelected = false,
	label,
}) => <Text color={isSelected ? "#00acee" : undefined}>{label}</Text>;

const DefaultIndicatorComponent: VFC<IndicatorProps> = ({
	isSelected = false,
}) => (
	<Box marginRight={1}>
		{isSelected ? (
			<Text color="#00acee">{figures.squareLeft}</Text>
		) : (
			<Text> </Text>
		)}
	</Box>
);

function Select<V>({
	items = [],
	onSelect,
	itemComponent = DefaultItemComponent,
	indicatorComponent = DefaultIndicatorComponent,
	limit = undefined,
	initialIndex = 0,
}: Props<V>): JSX.Element {
	return (
		<CustomSelectInput
			items={items}
			onSelect={onSelect}
			itemComponent={itemComponent}
			indicatorComponent={indicatorComponent}
			limit={limit}
			initialIndex={initialIndex}
		/>
	);
}

export function NoRotateSelect<V>({
	items = [],
	onSelect,
	onHighlight,
	itemComponent = DefaultItemComponent,
	indicatorComponent = DefaultIndicatorComponent,
	selectedComponent = undefined,
	limit = undefined,
	initialIndex = 0,
	forceUnselect = undefined,
}: Props<V>): JSX.Element {
	return (
		<NoRotate
			items={items}
			onSelect={onSelect}
			onHighlight={onHighlight}
			itemComponent={itemComponent}
			indicatorComponent={indicatorComponent}
			limit={limit}
			initialIndex={initialIndex}
			selectedComponent={selectedComponent}
			forceUnselect={forceUnselect}
		/>
	);
}

export default Select;
