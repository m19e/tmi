import React from "react";
import PropTypes from "prop-types";
import { AuthContainer } from "../src/components/pages/AuthContainer";
import { Columns } from "../src/components/organisms/Columns";
import { ColumnSwitcher } from "../src/components/organisms/ColumnSwitcher";
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
