import React from "react";
import PropTypes from "prop-types";
import {
	AuthContainer,
	AuthContainerV2,
} from "../src/components/AuthContainer";
import ListPage, { ListV2 as ListPageV2 } from "../src/components/pages/List";

/// Hello world command
const Tink = () => {
	// return <AuthContainer page={ListPage} />;
	return <AuthContainerV2 page={ListPageV2} />;
};

Tink.propTypes = {
	/// Name of the person to greet
	name: PropTypes.string,
};

export default Tink;
