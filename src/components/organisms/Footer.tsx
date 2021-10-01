import React, { Fragment } from "react";
import type { VFC } from "react";
import { Text } from "ink";
import { useError, useRequestResult, useHint } from "../../hooks";

const Error: VFC = () => {
	const [error] = useError();
	if (error) {
		return (
			<Text color="black" backgroundColor="red">
				<Text> {error} </Text>
			</Text>
		);
	}
	return null;
};

const RequestResult: VFC = () => {
	const [requestResult] = useRequestResult();
	if (requestResult) {
		return (
			<Text color="black" backgroundColor="green">
				<Text> {requestResult} </Text>
			</Text>
		);
	}
	return null;
};

const Hint: VFC = () => {
	const [hint] = useHint();
	if (hint) {
		<Text> {hint} </Text>;
	}
	return null;
};

const Footer: VFC = () => {
	return (
		<Fragment>
			<Error />
			<RequestResult />
			<Hint />
		</Fragment>
	);
};

export default Footer;
