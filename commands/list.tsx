import React from "react";
import PropTypes from "prop-types";
import { AuthContainer } from "../src/components/AuthContainer";
import { List as ListPage } from "../src/components/pages/List";

/// List Command
const ListCommand = () => {
	return (
		<AuthContainer>
			<ListPage />
		</AuthContainer>
	);
};

export default ListCommand;
