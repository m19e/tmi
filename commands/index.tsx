import React from "react";
import PropTypes from "prop-types";
import { AuthContainer } from "../src/components/AuthContainer";
import { ListV2 as ListPage } from "../src/components/pages/ListV2";

/// Hello world command
const Tink = () => {
	return <AuthContainer page={ListPage} />;
};

Tink.propTypes = {
	/// Name of the person to greet
	name: PropTypes.string,
};

export default Tink;
