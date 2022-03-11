import type { UserMenuAction } from "../../types";
import type { Item } from "./SelectInput";
import SelectInput from "./SelectInput";
import { BreakLineItem } from "../atoms/BreakLineItem";

export const UserMenuSelect = ({
	items,
	onSelect,
}: {
	items: Item<UserMenuAction>[];
	onSelect: ({ value: action }: Item<UserMenuAction>) => void;
}) => {
	return (
		<SelectInput
			items={items}
			itemComponent={BreakLineItem}
			onSelect={onSelect}
		/>
	);
};
