import React, { useState } from "react";
import { Box, useInput } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import { useHint, useColumnMap, useCurrentColumn } from "../../hooks";
import { ColumnController } from "../organisms/Column/Controller";
import { ColumnHeader } from "../organisms/Column/Header";
import { ColumnSwitcher } from "../organisms/Column/Switcher";

export const ColumnTemplate = () => {
	const [, rows] = useDimensions();

	return (
		<Box flexDirection="column" minHeight={rows}>
			<ColumnContainer />
		</Box>
	);
};

const ColumnContainer = () => {
	const [{ key: hintKey }] = useHint();
	const [columns] = useColumnMap();
	const [, { setColumnKey }] = useCurrentColumn();
	const [status, setStatus] = useState<"page" | "controll">("page");

	useInput(
		(input, key) => {
			if (input === "c" && status === "page") {
				setStatus("controll");
			} else if (key.escape && status === "controll") {
				const firstKey: string = columns.keys().next().value;
				setColumnKey(firstKey);
				setStatus("page");
			}
		},
		{ isActive: hintKey === "timeline" || hintKey === "search/timeline" }
	);

	const handleBack = () => setStatus("page");

	if (status === "page") {
		return (
			<>
				<ColumnHeader />
				<ColumnSwitcher />
			</>
		);
	}
	if (status === "controll") {
		return <ColumnController onBack={handleBack} />;
	}
};
