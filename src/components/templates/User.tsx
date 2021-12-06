import React, { useState, useEffect } from "react";
import type { VFC } from "react";
import { Box, Text } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import type { UserV1, FriendshipV1 } from "twitter-api-v2";

import { useUserConfig, useError } from "../../hooks";
import { useApi } from "../../hooks/api";
import Footer from "../organisms/Footer";
import SelectInput, { Item } from "../molecules/SelectInput";

interface FriendshipProps {
	relation: FriendshipV1["relationship"];
}

const FriendshipLabel = ({ relation }: FriendshipProps) => {
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

interface UserMenuProps extends FriendshipProps {
	user: UserV1;
}

type UserMenuAction =
	| "tweets"
	| "following"
	| "followed"
	| "favorites"
	| "listed"
	| "list/add-remove"
	| "follow"
	| "unfollow"
	| "mute"
	| "block"
	| "profile";

const MenuComponent: VFC<{ isSelected?: boolean; label: string }> = ({
	isSelected = false,
	label,
}) => (
	<Box marginBottom={1}>
		<Text color={isSelected ? "#00acee" : undefined}>{label}</Text>
	</Box>
);

const UserMenu = ({ user, relation }: UserMenuProps) => {
	const myself = relation.source.id_str === relation.target.id_str;

	const api = useApi();

	const [menuItems, setMenuItems] = useState<Item<UserMenuAction>[]>([]);
	const [debugConsole, setDebugConsole] = useState("empty");

	useEffect(() => {
		let actions: Item<UserMenuAction>[] = [
			{
				label: `${user.statuses_count} tweets`,
				value: "tweets",
			},
			{
				label: `${user.friends_count} follows`,
				value: "following",
			},
			{
				label: `${user.followers_count} followers`,
				value: "followed",
			},
			{
				label: `${user.favourites_count} favorites`,
				value: "favorites",
			},
			{
				label: `${user.listed_count} listed`,
				value: "listed",
			},
			{
				label: "Add to / Remove from lists",
				value: "list/add-remove",
			},
		];
		if (myself) {
			actions = [...actions, { label: "Edit profile", value: "profile" }];
		} else {
			const follow: Item<UserMenuAction> = relation.source.following
				? {
						label: "Unfollow this user",
						value: "unfollow",
				  }
				: {
						label: "Follow this user",
						value: "follow",
				  };
			actions = [
				...actions,
				follow,
				{ label: "Mute this user", value: "mute" },
				{ label: "Block this user", value: "block" },
			];
		}
		const keyed = actions.map((a) => ({ ...a, key: a.value }));
		setMenuItems(keyed);

		return () => setMenuItems([]);
	}, [user]);

	const transitionListed = async () => {
		const { id_str } = user;
		const res = await api.getUserListed({
			user_id: id_str,
			count: 1000,
		});
		if (typeof res === "string") {
			return;
		}
		const { lists, ...cursors } = res.data;
		setDebugConsole(
			JSON.stringify(
				[
					{ length: lists.length, ...cursors },
					lists.map((l) => `@${l.user.screen_name}/${l.name}`),
				],
				null,
				2
			)
		);
	};

	const handleSelectMenu = ({ value: action }: Item<UserMenuAction>) => {
		if (action === "tweets") {
			// "statuses/user_timeline"
			// implemented
			// api.userTimeline(userId)
		} else if (action === "following") {
			// yet
		} else if (action === "followed") {
			// yet
		} else if (action === "favorites") {
			// yet
		} else if (action === "listed") {
			transitionListed();
		} else if (action === "list/add-remove") {
			// "lists/members/create" or "lists/members/create_all"
			// "lists/members/destroy" or "lists/members/destroy_all"
			// implemented
			// api.addListMembers({ list_id, user_id })
			// api.addListMembers({ list_id, user_id[] })
			// api.removeListMembers({ list_id, user_id })
			// api.removeListMembers({ list_id, user_id[] })
		} else if (action === "profile") {
			// implemented
		} else if (action === "follow") {
			// yet
		} else if (action === "unfollow") {
			// yet
		} else if (action === "mute") {
			// yet
		} else if (action === "block") {
			// yet
		}
	};

	return (
		<>
			<SelectInput
				items={menuItems}
				itemComponent={MenuComponent}
				onSelect={handleSelectMenu}
			/>
			<Text>{debugConsole}</Text>
		</>
	);
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
		useState<FriendshipV1["relationship"]>();
	const [status, setStatus] = useState<"load" | "user">("load");

	const [menuItems, setMenuItems] = useState<Item<UserMenuAction>[]>([]);
	const [debugConsole, setDebugConsole] = useState("empty");

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
					setRelationship(rel.relationship);
				}
			}
			setStatus("user");
		};
		f();
	}, []);

	const makeCheckedMenu = (u: UserV1, rel: FriendshipV1["relationship"]) => {
		const myself = rel.source.id_str === rel.target.id_str;

		let actions: Item<UserMenuAction>[] = [
			{
				label: `${u.statuses_count} tweets`,
				value: "tweets",
			},
			{
				label: `${u.friends_count} follows`,
				value: "following",
			},
			{
				label: `${u.followers_count} followers`,
				value: "followed",
			},
			{
				label: `${u.favourites_count} favorites`,
				value: "favorites",
			},
			{
				label: `${u.listed_count} listed`,
				value: "listed",
			},
			{
				label: "Add to / Remove from lists",
				value: "list/add-remove",
			},
		];
		if (myself) {
			actions = [...actions, { label: "Edit profile", value: "profile" }];
		} else {
			const follow: Item<UserMenuAction> = rel.source.following
				? {
						label: "Unfollow this user",
						value: "unfollow",
				  }
				: {
						label: "Follow this user",
						value: "follow",
				  };
			actions = [
				...actions,
				follow,
				{ label: "Mute this user", value: "mute" },
				{ label: "Block this user", value: "block" },
			];
		}

		const keyed = actions.map((a) => ({ ...a, key: a.value }));
		return keyed;
	};

	const transitionListed = async () => {
		const { id_str } = user;
		const res = await api.getUserListed({
			user_id: id_str,
			count: 1000,
		});
		if (typeof res === "string") {
			return;
		}
		const { lists, ...cursors } = res.data;
		setDebugConsole(
			JSON.stringify(
				[
					{ length: lists.length, ...cursors },
					lists.map((l) => `@${l.user.screen_name}/${l.name}`),
				],
				null,
				2
			)
		);
	};

	const handleSelectMenu = ({ value: action }: Item<UserMenuAction>) => {
		if (action === "tweets") {
			// "statuses/user_timeline"
			// implemented
			// api.userTimeline(userId)
		} else if (action === "following") {
			// yet
		} else if (action === "followed") {
			// yet
		} else if (action === "favorites") {
			// yet
		} else if (action === "listed") {
			transitionListed();
		} else if (action === "list/add-remove") {
			// "lists/members/create" or "lists/members/create_all"
			// "lists/members/destroy" or "lists/members/destroy_all"
			// implemented
			// api.addListMembers({ list_id, user_id })
			// api.addListMembers({ list_id, user_id[] })
			// api.removeListMembers({ list_id, user_id })
			// api.removeListMembers({ list_id, user_id[] })
		} else if (action === "profile") {
			// implemented
		} else if (action === "follow") {
			// yet
		} else if (action === "unfollow") {
			// yet
		} else if (action === "mute") {
			// yet
		} else if (action === "block") {
			// yet
		}
	};

	if (status === "load") {
		return <Text>Loading...</Text>;
	}
	return (
		<Box flexDirection="column" minHeight={rows}>
			<Box flexDirection="column" flexGrow={1}>
				<Box marginBottom={1}>
					<Text>
						{user.name} {user.protected && "🔒 "}(@{user.screen_name})
					</Text>
				</Box>
				<FriendshipLabel relation={relationship} />
				{!!user.description && (
					<Box marginBottom={1}>
						<Text>{user.description}</Text>
					</Box>
				)}
				{!!user.location && (
					<Box marginBottom={1}>
						<Text>Location: {user.location}</Text>
					</Box>
				)}
				{!!user.url && (
					<Box marginBottom={1}>
						<Text>
							URL: {user.entities.url.urls[0].display_url} (
							{user.entities.url.urls[0].expanded_url})
						</Text>
					</Box>
				)}
				<UserMenu user={user} relation={relationship} />
				{/* <Text>{JSON.stringify(user.entities, null, 4)}</Text> */}
			</Box>
			<Footer />
		</Box>
	);
};
