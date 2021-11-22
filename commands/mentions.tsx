import React from "react";
import { AuthContainer } from "../src/components/pages/AuthContainer";
import { MentionsSub } from "../src/components/templates/Mentions";

/// Mentions command
const MentionsCommand = () => {
	return (
		<AuthContainer>
			<MentionsSub />
		</AuthContainer>
	);
};

export default MentionsCommand;
