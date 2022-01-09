import React from "react";
import PropTypes from "prop-types";
import { AuthContainer } from "../src/components/pages/AuthContainer";
import { SearchSub } from "../src/components/templates/Search";

interface Props {
	query: string;
}

/// Search command
const SearchCommand = ({ query }: Props) => {
	return (
		<AuthContainer>
			<SearchSub query={query} />
		</AuthContainer>
	);
};

SearchCommand.propTypes = {
	/// Search word input
	query: PropTypes.string.isRequired,
};

SearchCommand.shortFlags = {
	query: "q",
};

export default SearchCommand;
