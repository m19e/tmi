import React, { useState, useEffect } from "react";
import type { VFC } from "react";
import { Box, Text } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import type {
	UserV1,
	FriendshipV1,
	ListV1,
	TweetV1,
	UserTimelineV1Paginator,
} from "twitter-api-v2";

import type { TrimmedList } from "../../types/twitter";
import { useUserConfig, useError } from "../../hooks";
import { useApi } from "../../hooks/api";
import Footer from "../organisms/Footer";
import SelectInput, { Item } from "../molecules/SelectInput";
import { SelectMemberedList } from "../molecules/SelectMemberedList";

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

const MenuComponent: VFC<{ isSelected?: boolean; label: string }> = ({
	isSelected = false,
	label,
}) => (
	<Box marginBottom={1}>
		<Text color={isSelected ? "#00acee" : undefined}>{label}</Text>
	</Box>
);

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
	const [status, setStatus] = useState<
		"load" | "user" | "tweets" | "listed" | "list" | "list/member/manage"
	>("load");

	const [menuItems, setMenuItems] = useState<Item<UserMenuAction>[]>([]);
	const [listed, setListed] = useState<ListV1[]>([]);
	const [currentList, setCurrentList] = useState<TrimmedList>();
	const [listTimeline, setListTimeline] = useState<TweetV1[]>([]);

	const [nextCursor, setNextCursor] = useState("0");
	const [remainIds, setRemainIds] = useState<string[]>([]);
	const [users, setUsers] = useState<UserV1[]>([]);

	const [userTimelinePaginator, setUserTimelinePaginator] = useState<
		UserTimelineV1Paginator | undefined
	>(undefined);

	const [debugConsole, setDebugConsole] = useState("empty");

	useEffect(() => {
		const f = async () => {
			const res = await api.getUser({ screen_name: sname });
			if (typeof res === "string") {
				setError(res);
				return;
			}
			setUser(res);
			const rel = await api.getRelation({
				source_id: authUserId,
				target_id: res.id_str,
			});
			if (typeof rel === "string") {
				setError(rel);
			} else {
				setRelationship(rel.relationship);
				initMenu(res, rel.relationship);
			}
			setStatus("user");
		};
		f();
	}, []);

	const initMenu = (u: UserV1, rel: FriendshipV1["relationship"]) => {
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
		setMenuItems(keyed);
	};

	const getUsersFromIds = async (ids: string[]) => {
		const user_id = ids.slice(0, 100);
		const remain = ids.slice(100, ids.length);
		const res = await api.getUsers({
			user_id,
			skip_status: true,
		});
		if (typeof res === "string") {
			setError(res);
			return;
		}
		setUsers(res);
		setRemainIds(remain);
	};

	const transitionTweets = async () => {
		const res = await api.getUserTimeline({
			user_id: user.id_str,
			include_rts: true,
			tweet_mode: "extended",
			count: 200,
		});
		if (typeof res === "string") {
			setError(res);
			return;
		}
		setUserTimelinePaginator(res);
		setDebugConsole(
			JSON.stringify(
				res.tweets.map((t) => `@${t.user.screen_name} ${t.full_text}`),
				null,
				2
			)
		);
		setStatus("tweets");
	};
	const transitionFollowing = async () => {
		const res = await api.userFollowing({
			user_id: user.id_str,
			stringify_ids: true,
			count: 5000,
		});
		if (typeof res === "string") {
			setError(res);
			return;
		}
		const { ids, next_cursor_str } = res;
		setNextCursor(next_cursor_str);
		await getUsersFromIds(ids);
	};
	const transitionFollowed = async () => {
		const res = await api.userFollowed({
			user_id: user.id_str,
			stringify_ids: true,
			count: 5000,
		});
		if (typeof res === "string") {
			setError(res);
			return;
		}
		const { ids, next_cursor_str } = res;
		setNextCursor(next_cursor_str);
		await getUsersFromIds(ids);
	};
	const transitionFavorites = async () => {
		const res = await api.userFavorites({
			user_id: user.id_str,
			tweet_mode: "extended",
			count: 200,
		});
		if (typeof res === "string") {
			setDebugConsole(res);
			return;
		}
		setDebugConsole(JSON.stringify(res, null, 2));
	};
	const transitionListed = async () => {
		const user_id = user.id_str;
		const res = await api.getUserListed({
			user_id,
			count: 1000,
		});
		if (typeof res === "string") {
			return;
		}
		const { lists, ...cursors } = res.data;
		setListed(lists);
		setDebugConsole(
			JSON.stringify({ length: lists.length, ...cursors }, null, 2)
		);
		setStatus("listed");
	};

	const handleSelectMenu = ({ value: action }: Item<UserMenuAction>) => {
		if (action === "tweets") {
			transitionTweets();
		} else if (action === "following") {
			transitionFollowing();
		} else if (action === "followed") {
			transitionFollowed();
		} else if (action === "favorites") {
			transitionFavorites();
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
			setStatus("list/member/manage");
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

	const handleSelectList = async ({ value: list }: Item<ListV1>) => {
		const res = await api.getListTweets({
			list_id: list.id_str,
			count: 200,
			tweet_mode: "extended",
			include_entities: true,
		});
		if (typeof res === "string") {
			return;
		}
		const { id_str, name, mode, user } = list;
		setCurrentList({
			id_str,
			name,
			mode,
			owner: {
				id_str: user.id_str,
				name: user.name,
				screen_name: user.screen_name,
			},
		});
		setListTimeline(res);
		setStatus("list");
	};

	if (status === "load") {
		return (
			<>
				<Text>Loading...</Text>
				<Footer />
			</>
		);
	}
	if (status === "user") {
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
					<SelectInput
						items={menuItems}
						itemComponent={MenuComponent}
						onSelect={handleSelectMenu}
					/>
				</Box>
				<Text>{debugConsole}</Text>
				<Footer />
			</Box>
		);
	}
	if (status === "tweets") {
		return (
			<Text>
				<Text color="#00acee">@{user.screen_name}</Text>'s tweets
			</Text>
		);
	}
	if (status === "listed") {
		return (
			<Box flexDirection="column" minHeight={rows}>
				<Box marginBottom={1}>
					<Text>
						Lists <Text color="#00acee">@{user.screen_name}</Text>'s on
					</Text>
				</Box>
				<SelectMemberedList lists={listed} onSelect={handleSelectList} />
			</Box>
		);
	}
	if (status === "list") {
		return (
			<>
				<Text>{JSON.stringify(currentList, null, 4)}</Text>
				{listTimeline.slice(0, 20).map((tweet) => (
					<Text>
						@{tweet.user.screen_name} {tweet.full_text}
					</Text>
				))}
			</>
		);
	}
	return null;
};
