import React from "react";
import { AuthContainer } from "../src/components/pages/AuthContainer";
import { HomeSub } from "../src/components/templates/Home";

/// Home command
const HomeCommand = () => {
	return (
		<AuthContainer>
			<HomeSub />
		</AuthContainer>
	);
};

export default HomeCommand;
