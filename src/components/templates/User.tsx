import React, { useState, useEffect, useCallback } from "react";
import type { VFC, Dispatch, SetStateAction } from "react";
import { Box, Text, useInput } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import type {
	UserV1,
	FriendshipV1,
	ListV1,
	TweetV1,
	UserTimelineV1Paginator,
	ListMembershipsV1Paginator,
	ListTimelineV1Paginator,
} from "twitter-api-v2";
import useUndo from "use-undo";

import type { TrimmedList } from "../../types/twitter";
import { convertTweetToDisplayable } from "../../lib";
import {
	useUserConfig,
	useError,
	useRequestResult,
	useHint,
} from "../../hooks";
import { useApi } from "../../hooks/api";
import Footer from "../organisms/Footer";
import SelectInput from "../molecules/SelectInput";
import type { Item } from "../molecules/SelectInput";
import { TimelineSelect } from "../molecules/TimelineSelect";
import { SelectMemberedList } from "../molecules/SelectMemberedList";
import { ListMemberManage } from "../molecules/ListMemberManage";

type UserMenuAction =
	| "tweets"
	| "following"
	| "followed"
	| "favorites"
	| "listed"
	| "list/manage"
	| "follow/manage"
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

const BreakLineItem: VFC<{ isSelected?: boolean; label: string }> = ({
	isSelected = false,
	label,
}) => (
	<Box marginBottom={1}>
		<Text color={isSelected ? "#00acee" : undefined}>{label}</Text>
	</Box>
);

interface ReturnType {
	count: number;
	increment: () => void;
	decrement: () => void;
	reset: () => void;
	setCount: Dispatch<SetStateAction<number>>;
}

const usePositiveCounter = (initialValue?: number): ReturnType => {
	const [count, setCount] = useState(initialValue || 0);

	const increment = () => setCount((x) => x + 1);
	const decrement = () => setCount((x) => Math.max(x - 1, 1));
	const reset = () => setCount(initialValue || 0);

	return {
		count,
		increment,
		decrement,
		reset,
		setCount,
	};
};

const useUserTimeline = () => {
	const [paginator, setP] = useState<UserTimelineV1Paginator | undefined>(
		undefined
	);
	const [tweets, setTweets] = useState<TweetV1[]>([]);

	const setPaginator: typeof setP = (action) => {
		setP((prevP) => {
			const newPaginator =
				typeof action === "function" ? action(prevP) : action;
			const newTweets = newPaginator.tweets.map(convertTweetToDisplayable);

			setTweets((prevT) =>
				prevT.length ? [...prevT, ...newTweets] : newTweets
			);

			return newPaginator;
		});
	};
	const fetchNext = useCallback(async () => {
		if (typeof paginator === undefined) return;
		const newPaginator = await paginator.next(200);
		setPaginator(newPaginator);
	}, [paginator]);
	const updateTweet = (target: TweetV1) => {
		setTweets((prev) =>
			prev.map((t) => (t.id_str === target.id_str ? target : t))
		);
	};
	const removeTweet = (target_id: string) => {
		setTweets((prev) => prev.filter((t) => t.id_str !== target_id));
	};
	const reset = () => {
		setP(undefined);
		setTweets([]);
	};

	return {
		paginator,
		setPaginator,
		fetchNext,
		tweets,
		updateTweet,
		removeTweet,
		reset,
	};
};

const Breadcrumbs: VFC<{ root: string; breadcrumbs?: string[] }> = ({
	root,
	breadcrumbs,
}) => {
	if (Array.isArray(breadcrumbs)) {
		return (
			<Text>
				<Text color="#00acee">{root}</Text>
				{breadcrumbs.map((b) => (
					<Text key={b}>
						<Text dimColor>{" > "}</Text>
						<Text>{b}</Text>
					</Text>
				))}
			</Text>
		);
	}

	return <Text color="#00acee">{root}</Text>;
};

interface Props {
	sname: string;
}

export const UserSub = ({ sname }: Props) => {
	const [, rows] = useDimensions();

	const api = useApi();
	const [{ userId: authUserId }] = useUserConfig();
	const [, setRequestResult] = useRequestResult();
	const [, setError] = useError();
	const [, setHint] = useHint();

	const [user, setUser] = useState<UserV1 | undefined>(undefined);
	const [relationship, setRelationship] =
		useState<FriendshipV1["relationship"]>();
	const [
		{ present: status },
		{ set: setStatus, canUndo: canStatusBack, undo: statusBack },
	] = useUndo<
		| "load"
		| "user"
		| "tweets"
		| "tweets/detail"
		| "listed"
		| "list/tweets"
		| "list/tweets/detail"
		| "list/manage"
		| "list/manage/action"
		| "follow/manage"
	>("load");

	const [menuItems, setMenuItems] = useState<Item<UserMenuAction>[]>([]);

	const [nextCursor, setNextCursor] = useState("0");
	const [remainIds, setRemainIds] = useState<string[]>([]);
	const [users, setUsers] = useState<UserV1[]>([]);

	const limitCounter = usePositiveCounter(5);

	const userTimeline = useUserTimeline();

	const [focusedTweet, setFocusedTweet] = useState<TweetV1 | undefined>(
		undefined
	);
	const [isFetching, setIsFetching] = useState(false);

	const [listedPaginator, setListedPaginator] = useState<
		ListMembershipsV1Paginator | undefined
	>(undefined);
	const [currentList, setCurrentList] = useState<TrimmedList>();

	// TODO add list-timeline data custom hook
	const [listTimelinePaginator, setListTimelinePaginator] = useState<
		ListTimelineV1Paginator | undefined
	>(undefined);
	const [listTweets, setListTweets] = useState<TweetV1[]>([]);

	const [lists, setLists] = useState<ListV1[]>([]);
	const [manageList, setManageList] = useState<ListV1 | undefined>(undefined);

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
				value: "list/manage",
			},
		];
		if (myself) {
			actions = [...actions, { label: "Edit profile", value: "profile" }];
		} else {
			const follow: Item<UserMenuAction> = rel.source.following
				? {
						label: "Unfollow this user",
						value: "follow/manage",
				  }
				: {
						label: "Follow this user",
						value: "follow/manage",
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

	const transitionTweets = useCallback(async () => {
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
		userTimeline.setPaginator(res);
		setStatus("tweets");
	}, [user]);
	const transitionFollowing = useCallback(async () => {
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
	}, [user]);
	const transitionFollowed = useCallback(async () => {
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
	}, [user]);
	const transitionFavorites = useCallback(async () => {
		const res = await api.userFavorites({
			user_id: user.id_str,
			tweet_mode: "extended",
			count: 200,
		});
		if (typeof res === "string") {
			setError(res);
			return;
		}
		setDebugConsole(JSON.stringify(res, null, 2));
	}, [user]);
	const transitionListed = useCallback(async () => {
		const res = await api.getUserListed({
			user_id: user.id_str,
			count: 1000,
		});
		if (typeof res === "string") {
			setError(res);
			return;
		}
		setListedPaginator(res);
		setStatus("listed");
	}, [user]);
	const transitionListManage = useCallback(async () => {
		const res = await api.getLists();
		if (!Array.isArray(res)) {
			setError(res.message);
			return;
		}
		setLists(res);
		setStatus("list/manage");
	}, [user]);
	const transitionFollowManage = useCallback(async () => {
		const rel = await api.getRelation({
			source_id: authUserId,
			target_id: user.id_str,
		});
		if (typeof rel === "string") {
			setError(rel);
			return;
		}
		setRelationship(rel.relationship);
		setStatus("follow/manage");
		initMenu(user, rel.relationship);
	}, [authUserId, user]);

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
		} else if (action === "list/manage") {
			transitionListManage();
		} else if (action === "profile") {
			// implemented
		} else if (action === "follow/manage") {
			transitionFollowManage();
		} else if (action === "mute") {
			// yet
		} else if (action === "block") {
			// yet
		}
	};

	const handleSelectTweet = ({ value: tweet }: { value: TweetV1 }) => {
		setFocusedTweet(tweet);
		setStatus("tweets/detail");
	};
	const handleHighlightTweet = useCallback(
		async ({ value: tweet }: { value: TweetV1 }) => {
			setFocusedTweet(tweet);
			if (isFetching) return;
			const { tweets } = userTimeline;
			const bottom = tweets[tweets.length - 1];
			if (bottom.id_str === tweet.id_str) {
				setIsFetching(true);
				await userTimeline.fetchNext();
				setIsFetching(false);
			}
		},
		[isFetching, userTimeline]
	);
	const handleSelectList = async ({ value: list }: { value: ListV1 }) => {
		const res = await api.getListTimeline({
			list_id: list.id_str,
			count: 200,
			tweet_mode: "extended",
			include_entities: true,
		});
		if (typeof res === "string") {
			setError(res);
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
		// TODO convert tweets to displayable
		setListTweets(res.tweets);
		setListTimelinePaginator(res);
		setStatus("list/tweets");
	};
	const handleSelectListTweet = ({ value: tweet }: { value: TweetV1 }) => {
		setFocusedTweet(tweet);
		setStatus("list/tweets/detail");
	};
	const handleHighlightListTweet = useCallback(
		async ({ value: tweet }: { value: TweetV1 }) => {
			setFocusedTweet(tweet);
			if (isFetching) return;
			const bottom = listTweets[listTweets.length - 1];
			if (bottom.id_str === tweet.id_str) {
				setIsFetching(true);
				const newPaginator = await listTimelinePaginator.next(200);
				// TODO convert tweets to displayable
				const newTweets = [...listTweets, ...newPaginator.tweets];
				setListTweets(newTweets);
				setListTimelinePaginator(newPaginator);
				setIsFetching(false);
			}
		},
		[isFetching, listTweets, listTimelinePaginator]
	);
	const handleSelectManageList = async ({ value: list }: { value: ListV1 }) => {
		setManageList(list);
		setStatus("list/manage/action");
	};
	const handleSelectListAction = async ({
		value: action,
	}: {
		value: "add" | "remove";
	}) => {
		const { id_str: list_id } = manageList;
		const { id_str: user_id } = user;

		const res =
			action === "add"
				? await api.addListMembers({ list_id, user_id })
				: await api.removeListMembers({ list_id, user_id });
		if (typeof res === "string") {
			setDebugConsole(res);
			return;
		}
		setDebugConsole(
			`Successfully ${action} @${user.screen_name} ${
				action === "add" ? "to" : "from"
			} @${manageList.user.screen_name}/${manageList.name}`
		);
		setStatus("list/manage");
	};
	const handleSelectFollowAction = async ({
		value: action,
	}: {
		value: "follow" | "unfollow" | "cancel";
	}) => {
		if (action === "cancel") {
			setStatus("user");
			return;
		}

		const { id_str: user_id } = user;
		const res =
			action === "follow"
				? await api.follow(user_id)
				: await api.unfollow(user_id);
		if (typeof res === "string") {
			setError(res);
			return;
		}
		setUser(res);
		setRequestResult(`Successfully ${action}ed: @${res.screen_name}`);

		const { id_str: target_id } = res;
		const rel = await api.getRelation({
			source_id: authUserId,
			target_id,
		});
		if (typeof rel === "string") {
			setError(rel);
		} else {
			setRelationship(rel.relationship);
			initMenu(res, rel.relationship);
		}
		setStatus("user");
	};

	useInput(
		useCallback(
			(_, key) => {
				if (key.escape && canStatusBack) {
					statusBack();
					if (status === "tweets") {
						setFocusedTweet(undefined);
					}
				}
			},
			[status, canStatusBack]
		),
		{
			isActive: status !== "load" && status !== "user",
		}
	);

	const updateTweet = (newTweet: TweetV1) => {
		userTimeline.updateTweet(newTweet);
		// setCurrentTweets((prev) =>
		// 	prev.map((t) => (t.id_str === newTweet.id_str ? newTweet : t))
		// );
	};
	const fav = useCallback(async () => {
		const { favorited, id_str: tweet_id } = focusedTweet;
		const res = favorited
			? await api.unfavorite(tweet_id)
			: await api.favorite(tweet_id);
		if (typeof res === "string") {
			setError(res);
		} else {
			updateTweet(res);
			setRequestResult(
				`Successfully ${res.favorited ? "favorited" : "unfavorited"}: @${
					res.user.screen_name
				} "${res.full_text.split("\n").join(" ")}"`
			);
		}
	}, [focusedTweet]);
	const rt = useCallback(async () => {
		const { retweeted, id_str: tweet_id } = focusedTweet;
		const res = retweeted
			? await api.unretweet(tweet_id)
			: await api.retweet(tweet_id);
		if (typeof res === "string") {
			setError(res);
		} else {
			updateTweet(res);
			setRequestResult(
				`Successfully ${res.retweeted ? "retweeted" : "unretweeted"}: @${
					res.user.screen_name
				} "${res.full_text.split("\n").join(" ")}"`
			);
		}
	}, [focusedTweet]);

	useInput(
		useCallback(
			(input, key) => {
				if (input === "+" || input === "=") {
					limitCounter.increment();
				} else if (input === "-" || input === "_") {
					limitCounter.decrement();
				} else if (input === "t") {
					rt();
				} else if (input === "f") {
					fav();
				} else if (input === "n") {
					// setIsNewTweetOpen(true);
				}
			},
			[limitCounter]
		),
		{
			isActive: status === "tweets",
		}
	);

	const rootLabel = user ? `@${user.screen_name}` : "*Invalid user*";

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
						<Breadcrumbs root={rootLabel} />
					</Box>
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
						itemComponent={BreakLineItem}
						onSelect={handleSelectMenu}
					/>
				</Box>
				<Text>{debugConsole}</Text>
				<Footer />
			</Box>
		);
	}
	if (status === "tweets" || status === "tweets/detail") {
		const breadcrumbs = status === "tweets" ? ["Tweets"] : ["Tweets", "Detail"];
		const { count: limit } = limitCounter;

		return (
			<Box flexDirection="column" minHeight={rows}>
				<Box flexDirection="column" flexGrow={1}>
					<Box marginBottom={1}>
						<Breadcrumbs root={rootLabel} breadcrumbs={breadcrumbs} />
					</Box>
					<TimelineSelect
						tweets={userTimeline.tweets}
						onSelectTweet={handleSelectTweet}
						onHighlightTweet={handleHighlightTweet}
						limit={limit}
					/>
				</Box>
				<Text>{debugConsole}</Text>
				<Footer />
			</Box>
		);
	}
	if (status === "listed") {
		const memberedLists = listedPaginator.lists;

		return (
			<Box flexDirection="column" minHeight={rows}>
				<Box marginBottom={1}>
					<Breadcrumbs root={rootLabel} breadcrumbs={["Listed"]} />
				</Box>
				<SelectMemberedList lists={memberedLists} onSelect={handleSelectList} />
			</Box>
		);
	}
	if (status === "list/tweets" || status === "list/tweets/detail") {
		const breadcrumbs =
			status === "list/tweets"
				? ["Listed", `@${currentList.owner.screen_name}/${currentList.name}`]
				: [
						"Listed",
						`@${currentList.owner.screen_name}/${currentList.name}`,
						"Detail",
				  ];
		const { count: limit } = limitCounter;

		return (
			<Box flexDirection="column" minHeight={rows}>
				<Box flexDirection="column" flexGrow={1}>
					<Box marginBottom={1}>
						<Breadcrumbs root={rootLabel} breadcrumbs={breadcrumbs} />
					</Box>
					<TimelineSelect
						tweets={listTweets}
						onSelectTweet={handleSelectListTweet}
						onHighlightTweet={handleHighlightListTweet}
						limit={limit}
					/>
				</Box>
				<Footer />
			</Box>
		);
	}
	if (status === "list/manage") {
		return (
			<Box flexDirection="column" minHeight={rows}>
				<Box flexDirection="column" flexGrow={1}>
					<ListMemberManage lists={lists} onSelect={handleSelectManageList} />
				</Box>
				<Text>{debugConsole}</Text>
				<Footer />
			</Box>
		);
	}
	if (status === "list/manage/action") {
		return (
			<Box flexDirection="column" minHeight={rows}>
				<Box flexDirection="column" flexGrow={1}>
					<Box marginBottom={1}>
						<Text>
							Select action to{" "}
							<Text color="#00acee">
								@{manageList.user.screen_name}/{manageList.name}
							</Text>
						</Text>
					</Box>
					<SelectInput
						items={[
							{ key: "add", label: "Add to List", value: "add" as "add" },
							{
								key: "remove",
								label: "Remove from List",
								value: "remove" as "remove",
							},
						]}
						onSelect={handleSelectListAction}
						itemComponent={BreakLineItem}
					/>
				</Box>
				<Text>{debugConsole}</Text>
				<Footer />
			</Box>
		);
	}
	if (status === "follow/manage") {
		return (
			<Box flexDirection="column" minHeight={rows}>
				<Box flexDirection="column" flexGrow={1}>
					<Box marginBottom={1}>
						<Text>
							{relationship.source.following ? "Unfollow" : "Follow"}{" "}
							<Text color="#00acee">@{user.screen_name}</Text>
						</Text>
					</Box>
					<SelectInput
						items={[
							relationship.source.following
								? {
										key: "unfollow",
										label: "OK",
										value: "unfollow" as "unfollow",
								  }
								: {
										key: "follow",
										label: "OK",
										value: "follow" as "follow",
								  },
							{
								key: "cancel",
								label: "cancel",
								value: "cancel" as "cancel",
							},
						]}
						onSelect={handleSelectFollowAction}
						itemComponent={BreakLineItem}
						initialIndex={1}
					/>
				</Box>
				<Text>{debugConsole}</Text>
				<Footer />
			</Box>
		);
	}
	return null;
};
