import React from "react";
import PropTypes from "prop-types";
import { AuthContainer } from "../src/components/AuthContainer";
import { List as ListPage } from "../src/components/pages/List";

/// Hello world command
const Tink = () => {
	return (
		<AuthContainer>
			<ListPage />
		</AuthContainer>
	);
};

Tink.propTypes = {
	/// Name of the person to greet
	name: PropTypes.string,
};

export default Tink;
