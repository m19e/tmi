import React from "react";
import { AuthContainer } from "../src/components/AuthContainer";
import { List as ListPage } from "../src/components/organisms/List";

/// List Command
const ListCommand = () => {
	return (
		<AuthContainer>
			<ListPage />
		</AuthContainer>
	);
};

export default ListCommand;
