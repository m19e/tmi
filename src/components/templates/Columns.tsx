import React from "react";
import { Box } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import { Columns } from "../organisms/Columns";
import { ColumnSwitcher } from "../organisms/ColumnSwitcher";

export const ColumnsTemplate = () => {
	const [, rows] = useDimensions();

	return (
		<Box flexDirection="column" minHeight={rows}>
			<Columns />
			<ColumnSwitcher />
		</Box>
	);
};
