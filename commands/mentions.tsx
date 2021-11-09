import React from "react";
import { AuthContainer } from "../src/components/pages/AuthContainer";
import { MentionsPage } from "../src/components/organisms/Mentions";

/// Mentions command
const MentionsCommand = () => {
	return (
		<AuthContainer>
			<MentionsPage />
		</AuthContainer>
	);
};

export default MentionsCommand;
