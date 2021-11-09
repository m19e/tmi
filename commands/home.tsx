import React from "react";
import { AuthContainer } from "../src/components/pages/AuthContainer";
import { HomePage } from "../src/components/organisms/Home";

/// Home command
const HomeCommand = () => {
	return (
		<AuthContainer>
			<HomePage />
		</AuthContainer>
	);
};

export default HomeCommand;
