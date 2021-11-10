import React from "react";
import PropTypes from "prop-types";
import { AuthContainer } from "../src/components/pages/AuthContainer";
import { SearchPage } from "../src/components/organisms/Search";

interface Props {
	query: string;
}

/// Search command
const SearchCommand = ({ query }: Props) => {
	return (
		<AuthContainer>
			<SearchPage query={query} />
		</AuthContainer>
	);
};

SearchCommand.propTypes = {
	query: PropTypes.string.isRequired,
};

export default SearchCommand;
