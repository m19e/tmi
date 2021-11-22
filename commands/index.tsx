import React from "react";
import PropTypes from "prop-types";
import { AuthContainer } from "../src/components/pages/AuthContainer";
import { ColumnsTemplate } from "../src/components/templates/Columns";

/// Index command
const IndexCommand = () => {
	return (
		<AuthContainer>
			<ColumnsTemplate />
		</AuthContainer>
	);
};

export default IndexCommand;
