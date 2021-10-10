import React from "react";
import type { FC } from "react";
import { Text } from "ink";
import { fallbackSymbols } from "../../lib/sindresorhus/figures";

type Props = {
	invalid: boolean;
	length: number;
	limit?: number;
};

const Counter: FC<Props> = ({ invalid, length, limit = 280 }) => (
	<Text color={invalid ? "redBright" : "gray"}>
		{invalid && <>[{fallbackSymbols.warning}] </>}
		{length}/{limit}
	</Text>
);

export default Counter;
