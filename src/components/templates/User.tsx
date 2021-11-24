import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import type { UserV1, FriendshipRelationObjectV1 } from "twitter-api-v2";

import { useUserConfig, useError } from "../../hooks";
import { useApi } from "../../hooks/api";
import Footer from "../organisms/Footer";

interface FriendshipProps {
	relation: FriendshipRelationObjectV1;
}

const FriendshipLabel = ({ relation }: FriendshipProps) => {
	const { blocked_by, blocking, following_requested, followed_by, following } =
		relation;

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
	return null;
};

interface Props {
	sname: string;
}

export const UserSub = ({ sname }: Props) => {
	const [, rows] = useDimensions();

	const api = useApi();
	const [{ userId: authUserId }] = useUserConfig();
	const [, setError] = useError();

	const [user, setUser] = useState<UserV1 | undefined>(undefined);
	const [relationship, setRelationship] =
		useState<FriendshipRelationObjectV1>();
	const [status, setStatus] = useState<"load" | "user">("load");

	useEffect(() => {
		const f = async () => {
			const res = await api.getUser({ screen_name: sname });
			if (typeof res === "string") {
				setError(res);
			} else {
				setUser(res);
				const rel = await api.getRelation({
					source_id: authUserId,
					target_id: res.id_str,
				});
				if (typeof rel === "string") {
					setError(rel);
				} else {
					setRelationship(rel.relationship.source);
				}
			}
			setStatus("user");
		};
		f();
	}, []);

	if (status === "load") {
		return <Text>Loading...</Text>;
	}
	return (
		<Box flexDirection="column" minHeight={rows}>
			<Box flexDirection="column" flexGrow={1}>
				<Box marginBottom={1}>
					<Text>
						{user.name} {user.protected && "🔒 "}(@{user.screen_name}){" "}
						<FriendshipLabel relation={relationship} />
					</Text>
				</Box>
				<Box marginBottom={1}>
					<Text>{user.description}</Text>
				</Box>
				{!!user.location && (
					<Box marginBottom={1}>
						<Text>Location: {user.location}</Text>
					</Box>
				)}
				{!!user.url && (
					<Box marginBottom={1}>
						<Text>URL: {user.url}</Text>
					</Box>
				)}
				<Box flexDirection="column" paddingLeft={2}>
					<Box marginBottom={1}>
						<Text>{user.statuses_count} tweets</Text>
					</Box>
					<Box marginBottom={1}>
						<Text>{user.friends_count} follows</Text>
					</Box>
					<Box marginBottom={1}>
						<Text>{user.followers_count} followers</Text>
					</Box>
					<Box marginBottom={1}>
						<Text>{user.favourites_count} favorites</Text>
					</Box>
					<Box marginBottom={1}>
						<Text>{user.listed_count} listed</Text>
					</Box>
					<Box marginBottom={1}>
						<Text>Add / Remove from lists</Text>
					</Box>
					<Box marginBottom={1}>
						<Text>Follow / Unfollow this user</Text>
					</Box>
					<Box marginBottom={1}>
						<Text>Mute this user</Text>
					</Box>
					<Box marginBottom={1}>
						<Text>Block this user</Text>
					</Box>
				</Box>
			</Box>
			<Footer />
		</Box>
	);
};
