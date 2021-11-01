import React, { useState } from "react";
import { Box, useInput } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import { ColumnController } from "../organisms/ColumnController";
import { Columns } from "../organisms/Columns";
import { ColumnSwitcher } from "../organisms/ColumnSwitcher";
import Footer from "../organisms/Footer";

export const ColumnsTemplate = () => {
	const [, rows] = useDimensions();

	return (
		<Box flexDirection="column" minHeight={rows}>
			<ColumnContainer />
		</Box>
	);
};

const ColumnContainer = () => {
	const [status, setStatus] = useState<"page" | "controll">("page");
	useInput((input, key) => {
		if (input === "c") {
			setStatus("controll");
		} else if (key.escape) {
			setStatus("page");
		}
	}, {});

	if (status === "page") {
		return (
			<>
				<Columns />
				<ColumnSwitcher />
				<Footer />
			</>
		);
	}
	if (status === "controll") {
		return <ColumnController />;
	}
};
