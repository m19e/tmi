import React from "react";
import type { FC } from "react";
import { Text } from "ink";
import { fallbackSymbols } from "../../lib/sindresorhus/figures";

type Props = {
	invalid: boolean;
	length: number;
};

const Counter: FC<Props> = ({ invalid, length }) => (
	<Text color={invalid ? "redBright" : "gray"}>
		{invalid && <>[{fallbackSymbols.warning}] </>}
		{length}/280
	</Text>
);

export default Counter;
