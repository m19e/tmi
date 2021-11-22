import React from "react";
import { AuthContainer } from "../src/components/pages/AuthContainer";
import { ColumnTemplate } from "../src/components/templates/Column";

/// Index command
const IndexCommand = () => {
	return (
		<AuthContainer>
			<ColumnTemplate />
		</AuthContainer>
	);
};

export default IndexCommand;
