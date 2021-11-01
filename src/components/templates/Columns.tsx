import React, { useState } from "react";
import { Box, useInput } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import { useHint } from "../../hooks";
import { ColumnController } from "../organisms/ColumnController";
import { Columns } from "../organisms/Columns";
import { ColumnSwitcher } from "../organisms/ColumnSwitcher";

export const ColumnsTemplate = () => {
	const [, rows] = useDimensions();

	return (
		<Box flexDirection="column" minHeight={rows}>
			<ColumnContainer />
		</Box>
	);
};

const ColumnContainer = () => {
	const [{ key: hintKey }] = useHint();
	const [status, setStatus] = useState<"page" | "controll">("page");

	useInput(
		(input, key) => {
			if (input === "c" && status === "page") {
				setStatus("controll");
			} else if (key.escape && status === "controll") {
				setStatus("page");
			}
		},
		{ isActive: hintKey === "timeline" }
	);

	if (status === "page") {
		return (
			<>
				<Columns />
				<ColumnSwitcher />
			</>
		);
	}
	if (status === "controll") {
		return <ColumnController />;
	}
};
