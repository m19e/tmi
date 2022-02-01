import type { VFC } from "react";
import { Text, Box } from "ink";
import figures from "../../lib/sindresorhus/figures";
import CustomSelectInput from "./CostumSelectInput";

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

interface Props<V> {
	/**
	 * Items to display in a list. Each item must be an object and have `label` and `value` props, it may also optionally have a `key` prop.
	 * If no `key` prop is provided, `value` will be used as the item key.
	 */
	items?: Array<Item<V>>;
	/**
	 * Listen to user's input. Useful in case there are multiple input components at the same time and input must be "routed" to a specific component.
	 *
	 * @default true
	 */
	isFocused?: boolean;
	/**
	 * Index of initially-selected item in `items` array.
	 *
	 * @default 0
	 */
	initialIndex?: number;
	/**
	 * Number of items to display.
	 */
	limit?: number;
	/**
	 * Custom component to override the default indicator component.
	 */
	indicatorComponent?: VFC<IndicatorProps>;
	/**
	 * Custom component to override the default item component.
	 */
	itemComponent?: VFC<ItemProps>;
	/**
	 * Function to call when user selects an item. Item object is passed to that function as an argument.
	 */
	onSelect?: (item: Item<V>) => void;
	/**
	 * Function to call when user highlights an item. Item object is passed to that function as an argument.
	 */
	onHighlight?: (item: Item<V>) => void;
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

export default Select;
