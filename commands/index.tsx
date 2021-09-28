import React from "react";
import PropTypes from "prop-types";
import ListPage from "../src/components/pages/List";

/// Hello world command
const Tink = () => {
	return <ListPage />;
};

Tink.propTypes = {
	/// Name of the person to greet
	name: PropTypes.string,
};

export default Tink;
