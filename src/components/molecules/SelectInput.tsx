import type { VFC } from "react";
import { Text, Box } from "ink";
import SelectInput from "ink-select-input";
import figures from "../../lib/sindresorhus/figures";

interface ItemProps {
	isSelected?: boolean;
	label: string;
}

interface Item<V> {
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

const ItemC: VFC<ItemProps> = ({ isSelected = false, label }) => (
	<Text color={isSelected ? "#00acee" : undefined}>{label}</Text>
);

const IndicatorC: VFC<IndicatorProps> = ({ isSelected = false }) => (
	<Box marginRight={1}>
		{isSelected ? (
			<Text color="#00acee">{figures.pointer}</Text>
		) : (
			<Text> </Text>
		)}
	</Box>
);

function Select<V>({ items = [], onSelect }: Props<V>): JSX.Element {
	return (
		<SelectInput
			items={items}
			onSelect={onSelect}
			itemComponent={ItemC}
			indicatorComponent={IndicatorC}
		/>
	);
}

export default Select;
