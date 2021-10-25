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

IndexCommand.propTypes = {
	/// Command args description example
	name: PropTypes.string,
};

export default IndexCommand;
