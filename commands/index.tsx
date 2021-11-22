import React from "react";
import PropTypes from "prop-types";
import { AuthContainer } from "../src/components/pages/AuthContainer";
import { ColumnTemplate } from "../src/components/templates/Columns";

/// Index command
const IndexCommand = () => {
	return (
		<AuthContainer>
			<ColumnTemplate />
		</AuthContainer>
	);
};

export default IndexCommand;
