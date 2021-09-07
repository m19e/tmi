import React from "react";
import { Text } from "ink";
import Spinner from "./Spinner";

type ForegroundColor =
	| "black"
	| "red"
	| "green"
	| "yellow"
	| "blue"
	| "magenta"
	| "cyan"
	| "white"
	| "gray"
	| "grey"
	| "blackBright"
	| "redBright"
	| "greenBright"
	| "yellowBright"
	| "blueBright"
	| "magentaBright"
	| "cyanBright"
	| "whiteBright";

type Props = {
	loading: boolean;
	namedColor?: ForegroundColor;
	rawColor?: string;
};

const Loader = ({ loading, namedColor, rawColor }: Props) => (
	<>
		{loading ? (
			<Text color={namedColor ?? rawColor}>
				<Spinner />
			</Text>
		) : (
			<Text> </Text>
		)}
	</>
);

export default Loader;
