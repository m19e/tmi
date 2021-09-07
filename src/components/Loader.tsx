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
	color: ForegroundColor | string;
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
