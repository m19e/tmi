import React from "react";
import PropTypes from "prop-types";
import { AuthContainer } from "../src/components/pages/AuthContainer";
import { Columns } from "../src/components/organisms/Columns";
import { ColumnSwitcher } from "../src/components/organisms/ColumnSwitcher";

/// Index command
const IndexCommand = () => {
	return (
		<AuthContainer>
			<Columns />
			<ColumnSwitcher />
		</AuthContainer>
	);
};

IndexCommand.propTypes = {
	/// Command args description example
	name: PropTypes.string,
};

export default IndexCommand;
