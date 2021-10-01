import React, { Fragment } from "react";
import type { VFC } from "react";
import { Box, Text } from "ink";
import { useError, useRequestResult, useHint } from "../../hooks";

const Error: VFC = () => {
	const [error] = useError();
	if (error) {
		return (
			<Box width="100%">
				<Text wrap="truncate-end" color="black" backgroundColor="red">
					<> {error} </>
				</Text>
			</Box>
		);
	}
	return null;
};

const RequestResult: VFC = () => {
	const [requestResult] = useRequestResult();
	if (requestResult) {
		return (
			<Box width="100%">
				<Text wrap="truncate-end" color="black" backgroundColor="green">
					<> {requestResult} </>
				</Text>
			</Box>
		);
	}
	return null;
};

const Hint: VFC = () => {
	const [hint] = useHint();
	if (hint) {
		return <Text> {hint} </Text>;
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
