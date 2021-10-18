import React from "react";
import PropTypes from "prop-types";
import { AuthContainerV2 } from "../src/components/AuthContainer";
import { ListV2 as ListPageV2 } from "../src/components/pages/ListV2";

/// Hello world command
const Tink = () => {
	return <AuthContainerV2 page={ListPageV2} />;
};

Tink.propTypes = {
	/// Name of the person to greet
	name: PropTypes.string,
};

export default Tink;
