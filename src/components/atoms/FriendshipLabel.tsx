import { Box, Text } from "ink";
import type { FriendshipV1 } from "twitter-api-v2";

interface FriendshipProps {
	relation: FriendshipV1["relationship"];
}

export const FriendshipLabel = ({ relation }: FriendshipProps) => {
	const { blocked_by, blocking, following_requested, followed_by, following } =
		relation.source;

	if (
		blocked_by ||
		blocking ||
		following_requested ||
		followed_by ||
		following
	) {
		return (
			<Box marginBottom={1}>
				{(() => {
					if (blocked_by && blocking) {
						return <Text color="red">[blocked / blocking]</Text>;
					}
					if (blocked_by) {
						return <Text color="red">[blocked]</Text>;
					}
					if (blocking) {
						return <Text color="red">[blocking]</Text>;
					}
					if (following_requested) {
						return <Text color="#00acee">[pending]</Text>;
					}
					if (followed_by && following) {
						return <Text color="#00acee">[followed / following]</Text>;
					}
					if (followed_by) {
						return <Text color="green">[followed]</Text>;
					}
					if (following) {
						return <Text color="yellow">[following]</Text>;
					}
				})()}
			</Box>
		);
	}
	return null;
};
