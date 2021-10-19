import React from "react";
import type { FC } from "react";
import { Text } from "ink";
import type { TextProps } from "ink";
import Spinner from "./Spinner";

type Props = {
	loading: boolean;
	color: TextProps["color"];
};

const Loader: FC<Props> = ({ loading, color }) => (
	<>
		{loading ? (
			<Text color={color}>
				<Spinner />
			</Text>
		) : (
			<Text> </Text>
		)}
	</>
);

export default Loader;
