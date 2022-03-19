import type { FC } from "react";
import { Box } from "ink";
import useDimensions from "ink-use-stdout-dimensions";

interface Props {
	flexDirection?: "column" | "row" | "row-reverse" | "column-reverse";
}

export const FullScreen: FC<Props> = ({
	flexDirection = "column",
	children,
}) => {
	const [, rows] = useDimensions();

	return (
		<Box flexDirection={flexDirection} height={rows}>
			{children}
		</Box>
	);
};
