import React from "react";
import { Columns } from "../organisms/Columns";
import { ColumnSwitcher } from "../organisms/ColumnSwitcher";

export const ColumnsTemplate = () => {
	return (
		<>
			<Columns />
			<ColumnSwitcher />
		</>
	);
};
