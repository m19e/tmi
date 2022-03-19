import type { FC } from "react";
import { Box } from "ink";
import useDimensions from "ink-use-stdout-dimensions";

export const FullScreen: FC = ({ children }) => {
	const [, rows] = useDimensions();

	return <Box height={rows}>{children}</Box>;
};
