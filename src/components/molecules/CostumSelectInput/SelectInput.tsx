import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import type { FC } from "react";
import { Box, useInput } from "ink";
import isEqual from "lodash.isequal";

import { arrayRotate } from "./lib/arrayRotate";
import type { Props as IndicatorProps } from "./Indicator";
import type { Props as ItemProps } from "./Item";
import { Indicator } from "./Indicator";
import { Item } from "./Item";

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
	indicatorComponent?: FC<IndicatorProps>;

	/**
	 * Custom component to override the default item component.
	 */
	itemComponent?: FC<ItemProps>;

	/**
	 * Function to call when user selects an item. Item object is passed to that function as an argument.
	 */
	onSelect?: (item: Item<V>) => void;

	/**
	 * Function to call when user highlights an item. Item object is passed to that function as an argument.
	 */
	onHighlight?: (item: Item<V>) => void;
}

export interface Item<V> {
	key?: string;
	label: string;
	value: V;
}

function SelectInput<V>({
	items = [],
	isFocused = true,
	initialIndex = 0,
	indicatorComponent = Indicator,
	itemComponent = Item,
	limit: customLimit,
	onSelect,
	onHighlight,
}: Props<V>): JSX.Element {
	const [rotateIndex, setRotateIndex] = useState(0);
	const [selectedIndex, setSelectedIndex] = useState(initialIndex);
	const hasLimit =
		typeof customLimit === "number" && items.length > customLimit;
	const limit = hasLimit ? Math.min(customLimit!, items.length) : items.length;

	const previousItems = useRef<Array<Item<V>>>(items);

	useEffect(() => {
		if (
			!isEqual(
				previousItems.current.map((item) => item.value),
				items.map((item) => item.value)
			)
		) {
			setRotateIndex(0);
			setSelectedIndex(0);
		}

		previousItems.current = items;
	}, [items]);

	useInput(
		useCallback(
			(input, key) => {
				if (input === "k" || key.upArrow) {
					const lastIndex = (hasLimit ? limit : items.length) - 1;
					const atFirstIndex = selectedIndex === 0;
					const nextIndex = hasLimit ? selectedIndex : lastIndex;
					const nextRotateIndex = atFirstIndex ? rotateIndex + 1 : rotateIndex;
					const nextSelectedIndex = atFirstIndex
						? nextIndex
						: selectedIndex - 1;

					setRotateIndex(nextRotateIndex);
					setSelectedIndex(nextSelectedIndex);

					const slicedItems = hasLimit
						? arrayRotate(items, nextRotateIndex).slice(0, limit)
						: items;

					if (typeof onHighlight === "function") {
						onHighlight(slicedItems[nextSelectedIndex]);
					}
				}

				if (input === "j" || key.downArrow) {
					const atLastIndex =
						selectedIndex === (hasLimit ? limit : items.length) - 1;
					const nextIndex = hasLimit ? selectedIndex : 0;
					const nextRotateIndex = atLastIndex ? rotateIndex - 1 : rotateIndex;
					const nextSelectedIndex = atLastIndex ? nextIndex : selectedIndex + 1;

					setRotateIndex(nextRotateIndex);
					setSelectedIndex(nextSelectedIndex);

					const slicedItems = hasLimit
						? arrayRotate(items, nextRotateIndex).slice(0, limit)
						: items;

					if (typeof onHighlight === "function") {
						onHighlight(slicedItems[nextSelectedIndex]);
					}
				}

				if (key.return) {
					const slicedItems = hasLimit
						? arrayRotate(items, rotateIndex).slice(0, limit)
						: items;

					if (typeof onSelect === "function") {
						onSelect(slicedItems[selectedIndex]);
					}
				}
			},
			[
				hasLimit,
				limit,
				rotateIndex,
				selectedIndex,
				items,
				onSelect,
				onHighlight,
			]
		),
		{ isActive: isFocused }
	);

	const slicedItems = hasLimit
		? arrayRotate(items, rotateIndex).slice(0, limit)
		: items;

	return (
		<Box flexDirection="column">
			{slicedItems.map((item, index) => {
				const isSelected = index === selectedIndex;

				return (
					<Box key={item.key ?? item.label}>
						{React.createElement(indicatorComponent, { isSelected })}
						{React.createElement(itemComponent, { ...item, isSelected })}
					</Box>
				);
			})}
		</Box>
	);
}

function NoRotateSelectInput<V>({
	items = [],
	isFocused = true,
	initialIndex = 0,
	indicatorComponent = Indicator,
	itemComponent = Item,
	limit: customLimit,
	onSelect,
	onHighlight,
}: Props<V>): JSX.Element {
	const [rotateIndex, setRotateIndex] = useState(0);
	const [selectedIndex, setSelectedIndex] = useState(initialIndex);
	const hasLimit =
		typeof customLimit === "number" && items.length > customLimit;
	const limit = hasLimit ? Math.min(customLimit!, items.length) : items.length;

	const previousItems = useRef<Array<Item<V>>>(items);

	useEffect(() => {
		if (
			!isEqual(
				previousItems.current.map((item) => item.value),
				items.map((item) => item.value)
			)
		) {
			setRotateIndex(0);
			setSelectedIndex(0);
		}

		previousItems.current = items;
	}, [items]);

	useInput(
		useCallback(
			(input, key) => {
				if (input === "k" || key.upArrow) {
					const atFirstIndex = selectedIndex === 0;
					const nextRotateIndex = atFirstIndex
						? Math.max(0, rotateIndex - 1)
						: rotateIndex;
					const nextSelectedIndex = atFirstIndex ? 0 : selectedIndex - 1;

					setRotateIndex(nextRotateIndex);
					setSelectedIndex(nextSelectedIndex);

					const slicedItems = hasLimit
						? arrayRotate(items, nextRotateIndex).slice(0, limit)
						: items;

					if (typeof onHighlight === "function") {
						onHighlight(slicedItems[nextSelectedIndex]);
					}
				}

				if (input === "j" || key.downArrow) {
					const atLastIndex =
						selectedIndex === (hasLimit ? limit : items.length) - 1;
					const safeLine = items.length - limit;
					const nextRotateIndex = atLastIndex
						? Math.min(rotateIndex + 1, safeLine)
						: rotateIndex;
					const nextSelectedIndex = atLastIndex
						? selectedIndex
						: selectedIndex + 1;

					setRotateIndex(nextRotateIndex);
					setSelectedIndex(nextSelectedIndex);

					const slicedItems = hasLimit
						? arrayRotate(items, nextRotateIndex).slice(0, limit)
						: items;

					if (typeof onHighlight === "function") {
						onHighlight(slicedItems[nextSelectedIndex]);
					}
				}

				if (hasLimit) {
					if (key.pageUp) {
						const nextRotateIndex = Math.max(0, rotateIndex - limit);
						setRotateIndex(nextRotateIndex);
					}
					if (key.pageDown) {
						const nextRotateIndex =
							Math.min(items.length - limit, rotateIndex + limit) - 1;
						setRotateIndex(nextRotateIndex);
					}
				}

				if (key.return) {
					const slicedItems = hasLimit
						? arrayRotate(items, rotateIndex).slice(0, limit)
						: items;

					if (typeof onSelect === "function") {
						onSelect(slicedItems[selectedIndex]);
					}
				}
			},
			[
				hasLimit,
				limit,
				rotateIndex,
				selectedIndex,
				items,
				onSelect,
				onHighlight,
			]
		),
		{ isActive: isFocused }
	);

	// const slicedItems = hasLimit
	// 	? arrayRotate(items, rotateIndex).slice(0, limit)
	// 	: items;
	const slicedItems = hasLimit
		? items.slice(rotateIndex, rotateIndex + limit)
		: items;

	return (
		<Box flexDirection="column">
			{slicedItems.map((item, index) => {
				const isSelected = index === selectedIndex;

				return (
					<Box key={item.key ?? item.label}>
						{React.createElement(indicatorComponent, { isSelected })}
						{React.createElement(itemComponent, { ...item, isSelected })}
					</Box>
				);
			})}
		</Box>
	);
}

export default NoRotateSelectInput;
