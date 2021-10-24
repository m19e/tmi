import React from "react";
import PropTypes from "prop-types";
import { AuthContainer } from "../src/components/AuthContainer";
import { Columns } from "../src/components/organisms/Columns";

/// Index command
const IndexCommand = () => {
	return (
		<AuthContainer>
			<Columns />
		</AuthContainer>
	);
};

IndexCommand.propTypes = {
	/// Command args description example
	name: PropTypes.string,
};

export default IndexCommand;
