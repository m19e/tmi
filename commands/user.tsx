import React from "react";
import PropTypes from "prop-types";
import { Text } from "ink";
import { AuthContainer } from "../src/components/pages/AuthContainer";
import { UserSub } from "../src/components/templates/User";

interface Props {
	sname: string;
}

/// User command
const UserCommand = ({ sname }: Props) => {
	if (!sname) {
		return <Text color="redBright">Invalid screen_name: {`"${sname}"`}</Text>;
	}
	return (
		<AuthContainer>
			<UserSub sname={sname} />
		</AuthContainer>
	);
};

UserCommand.propTypes = {
	/// Pass user screen_name (require)
	sname: PropTypes.string.isRequired,
};

UserCommand.positionalArgs = ["sname"];

export default UserCommand;
