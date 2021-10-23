import React from "react";
import PropTypes from "prop-types";
import { AuthContainer } from "../src/components/AuthContainer";
import { List as ListPage } from "../src/components/pages/List";

/// Index command
const IndexCommand = () => {
	return (
		<AuthContainer>
			<ListPage />
		</AuthContainer>
	);
};

IndexCommand.propTypes = {
	/// Command args description example
	name: PropTypes.string,
};

export default IndexCommand;
