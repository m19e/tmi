import React from "react";
import { Text, TextProps } from "ink";
import Spinner from "./Spinner";

type Props = {
	loading: boolean;
	color: TextProps["color"];
};

const Loader = ({ loading, color }: Props) => (
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
