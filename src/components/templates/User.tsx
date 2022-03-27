import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import type {
	UserV1,
	FriendshipV1,
	ListV1,
	TweetV1,
	ListMembershipsV1Paginator,
} from "twitter-api-v2";
import useUndo from "use-undo";

import SelectInput from "../molecules/SelectInput";
import type { Item } from "../molecules/SelectInput";

import type { UserMenuAction } from "../../types";
import type { TrimmedList } from "../../types/twitter";
import {
	useUserConfig,
	useError,
	useRequestResult,
	useHint,
} from "../../hooks";
import { useApi } from "../../hooks/api";
import {
	usePositiveCounter,
	useUserTimeline,
	useListTimeline,
} from "../../hooks/timeline";
import Footer from "../organisms/Footer";
import { FullScreen } from "../organisms/FullScreen";
import { UserMenuSelect } from "../molecules/UserMenuSelect";
import { Timeline } from "../molecules/Timeline";
import type { Props as TimelineProps } from "../molecules/Timeline";
import { TweetDetail } from "../molecules/Timeline/Detail";
import type { Props as TweetDetailProps } from "../molecules/Timeline/Detail";
import { SelectMemberedList } from "../molecules/SelectMemberedList";
import { ListMemberManage } from "../molecules/ListMemberManage";
import { FriendshipLabel } from "../atoms/FriendshipLabel";
import { Breadcrumbs } from "../atoms/Breadcrumbs";
import { BreakLineItem } from "../atoms/BreakLineItem";

interface Props {
	sname: string;
}

export const UserSub = ({ sname }: Props) => {
	const api = useApi();
	const [{ userId: authUserId }] = useUserConfig();
	const [, setRequestResult] = useRequestResult();
	const [, setError] = useError();
	const [{ key: location }, setHintKey] = useHint();

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
	const listTimeline = useListTimeline();

	const [focusedTweet, setFocusedTweet] = useState<TweetV1 | undefined>(
		undefined
	);
	const [isFetching, setIsFetching] = useState(false);

	const [listedPaginator, setListedPaginator] = useState<
		ListMembershipsV1Paginator | undefined
	>(undefined);
	const [currentList, setCurrentList] = useState<TrimmedList>();

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
		setHintKey("timeline/detail");
	};
	const handleHighlightTweet = useCallback(
		async (item: { value: TweetV1 }) => {
			try {
				const tweet = item.value;
				setFocusedTweet(tweet);
				if (isFetching) return;
				const { tweets } = userTimeline;
				const bottom = tweets[tweets.length - 1];
				if (bottom.id_str === tweet.id_str) {
					setIsFetching(true);
					await userTimeline.fetchNext();
					setIsFetching(false);
				}
			} catch (error) {
				// do nothing in catch block
				// to avoid flickering console
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
		listTimeline.setPaginator(res);
		setStatus("list/tweets");
	};
	const handleSelectListTweet = ({ value: tweet }: { value: TweetV1 }) => {
		setFocusedTweet(tweet);
		setStatus("list/tweets/detail");
	};
	const handleHighlightListTweet = useCallback(
		async (item: { value: TweetV1 }) => {
			try {
				const tweet = item.value;
				setFocusedTweet(tweet);
				if (isFetching) return;
				const { tweets } = listTimeline;
				const bottom = tweets[tweets.length - 1];
				if (bottom.id_str === tweet.id_str) {
					setIsFetching(true);
					await listTimeline.fetchNext();
					setIsFetching(false);
				}
			} catch (error) {
				// do nothing in catch block
				// to avoid flickering console
			}
		},
		[isFetching, listTimeline]
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

	const isOpenTweetBox =
		location === "timeline/detail/input" ||
		location === "timeline/detail/wait-return";
	const stopInput = isOpenTweetBox || isFetching;

	const isAfterSelectedMenu = status !== "load" && status !== "user";
	const isActiveEscapeBack = isAfterSelectedMenu && !stopInput;

	useInput(
		useCallback(
			(_, key) => {
				if (key.escape && canStatusBack) {
					statusBack();
					if (status === "tweets" || status === "list/tweets") {
						setFocusedTweet(undefined);
						if (status === "tweets") userTimeline.reset();
						if (status === "list/tweets") listTimeline.reset();
					}
				}
			},
			[status, canStatusBack]
		),
		{
			isActive: isActiveEscapeBack,
		}
	);

	const updateTweet = useCallback(
		(newTweet: TweetV1) => {
			if (status === "tweets" || status === "tweets/detail") {
				userTimeline.updateTweet(newTweet);
			} else if (status === "list/tweets" || status === "list/tweets/detail") {
				listTimeline.updateTweet(newTweet);
			}
		},
		[status]
	);

	const fav = useCallback(async () => {
		const { favorited, id_str: tweet_id } = focusedTweet;
		const res = favorited
			? await api.unfavorite(tweet_id)
			: await api.favorite(tweet_id);
		if (typeof res === "string") {
			setError(res);
			return;
		}
		updateTweet(res);
		setRequestResult(
			`Successfully ${res.favorited ? "favorited" : "unfavorited"}: @${
				res.user.screen_name
			} "${res.full_text.split("\n").join(" ")}"`
		);
	}, [focusedTweet]);
	const rt = useCallback(async () => {
		const { retweeted, id_str: tweet_id } = focusedTweet;
		const res = retweeted
			? await api.unretweet(tweet_id)
			: await api.retweet(tweet_id);
		if (typeof res === "string") {
			setError(res);
			return;
		}
		updateTweet(res);
		setRequestResult(
			`Successfully ${res.retweeted ? "retweeted" : "unretweeted"}: @${
				res.user.screen_name
			} "${res.full_text.split("\n").join(" ")}"`
		);
	}, [focusedTweet]);

	const isTimeline = status === "tweets" || status === "list/tweets";
	const isDetail =
		status === "tweets/detail" || status === "list/tweets/detail";
	const isTimelineOrDetail = isTimeline || isDetail;
	const isActiveTimelineKeybind = isTimelineOrDetail && !stopInput;

	useInput(
		useCallback(
			(input, key) => {
				if (isTimeline) {
					if (input === "+" || input === "=") {
						limitCounter.increment();
					} else if (input === "-" || input === "_") {
						limitCounter.decrement();
					} else if (input === "n") {
						// setIsNewTweetOpen(true);
					} else if (input === "g") {
						// TODO will implement in footer hooks
						// toggleDisplayFooter()
					}
				}

				const shouldFetch = input === "t" || input === "f";
				if (shouldFetch) {
					(async () => {
						setIsFetching(true);
						if (input === "t") await rt();
						else if (input === "f") await fav();
						setIsFetching(false);
					})();
				}
			},
			[isTimeline, limitCounter]
		),
		{
			isActive: isActiveTimelineKeybind,
		}
	);

	const rootLabel = user ? `@${user.screen_name}` : "*Invalid user*";

	return (
		<FullScreen>
			<Box flexDirection="column" flexGrow={1}>
				{(() => {
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
							<>
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
								<UserMenuSelect items={menuItems} onSelect={handleSelectMenu} />
							</>
						);
					}
					if (status === "tweets" || status === "tweets/detail") {
						const isTweets = status === "tweets";
						const breadcrumbs = isTweets ? ["Tweets"] : ["Tweets", "Detail"];
						const updater = {
							update: userTimeline.updateTweet,
							remove: (id: string) => {
								statusBack();
								userTimeline.removeTweet(id);
								// TODO set hint "timeline"
							},
							redraft: (target: TweetV1) => {
								statusBack();
								userTimeline.removeTweet(target.id_str);
								// TODO set target.full_text to timeline/input
							},
						};

						return (
							<TimelineContainer
								root={rootLabel}
								breadcrumbs={breadcrumbs}
								isTweets={isTweets}
								tweets={userTimeline.tweets}
								onSelect={handleSelectTweet}
								onHighlight={handleHighlightTweet}
								limit={limitCounter.count}
								isFocused={isTweets}
								tweet={focusedTweet}
								updater={updater}
							/>
						);
					}
					if (status === "listed") {
						return (
							<>
								<Box marginBottom={1}>
									<Breadcrumbs root={rootLabel} breadcrumbs={["Listed"]} />
								</Box>
								<SelectMemberedList
									lists={listedPaginator.lists}
									onSelect={handleSelectList}
								/>
							</>
						);
					}
					if (status === "list/tweets" || status === "list/tweets/detail") {
						const isTweets = status === "list/tweets";
						const listNameLabel = `@${currentList.owner.screen_name}/${currentList.name}`;
						const breadcrumbs = isTweets
							? ["Listed", listNameLabel]
							: ["Listed", listNameLabel, "Detail"];
						const updater = {
							update: listTimeline.updateTweet,
							remove: (id: string) => {
								statusBack();
								listTimeline.removeTweet(id);
								// TODO set hint "timeline"
							},
							redraft: (target: TweetV1) => {
								statusBack();
								listTimeline.removeTweet(target.id_str);
								// TODO set target.full_text to timeline/input
							},
						};

						return (
							<TimelineContainer
								root={rootLabel}
								breadcrumbs={breadcrumbs}
								isTweets={isTweets}
								tweets={listTimeline.tweets}
								onSelect={handleSelectListTweet}
								onHighlight={handleHighlightListTweet}
								limit={limitCounter.count}
								isFocused={isTweets}
								tweet={focusedTweet}
								updater={updater}
							/>
						);
					}
					if (status === "list/manage") {
						return (
							<>
								<Box marginBottom={1}>
									<Breadcrumbs root={rootLabel} breadcrumbs={["Pick a List"]} />
								</Box>
								<ListMemberManage
									lists={lists}
									onSelect={handleSelectManageList}
								/>
							</>
						);
					}
					if (status === "list/manage/action") {
						const items = [
							{
								key: "add",
								label: "Add to List",
								value: "add" as "add",
							},
							{
								key: "remove",
								label: "Remove from List",
								value: "remove" as "remove",
							},
						];
						const breadcrumbs = [
							"Pick a List",
							`@${manageList.user.screen_name}/${manageList.name}`,
						];

						return (
							<>
								<Box marginBottom={1}>
									<Breadcrumbs root={rootLabel} breadcrumbs={breadcrumbs} />
								</Box>
								<SelectInput
									items={items}
									onSelect={handleSelectListAction}
									itemComponent={BreakLineItem}
								/>
							</>
						);
					}
					if (status === "follow/manage") {
						const followItem = relationship.source.following
							? {
									key: "unfollow",
									label: "Unfollow",
									value: "unfollow" as "unfollow",
							  }
							: {
									key: "follow",
									label: "Follow",
									value: "follow" as "follow",
							  };
						const items = [
							followItem,
							{
								key: "cancel",
								label: "cancel",
								value: "cancel" as "cancel",
							},
						];

						return (
							<>
								<Box marginBottom={1}>
									<Breadcrumbs
										root={rootLabel}
										breadcrumbs={["Follow Action"]}
									/>
								</Box>
								<SelectInput
									items={items}
									onSelect={handleSelectFollowAction}
									itemComponent={BreakLineItem}
									initialIndex={1}
								/>
							</>
						);
					}
					return null;
				})()}
			</Box>
			<Footer />
		</FullScreen>
	);
};

type TimelineContainerProps = TimelineProps &
	TweetDetailProps & {
		isTweets: boolean;
		root: string;
		breadcrumbs: string[];
	};

const TimelineContainer = ({
	root,
	breadcrumbs,
	isTweets,
	tweets,
	onSelect,
	onHighlight,
	limit,
	tweet,
	updater,
}: TimelineContainerProps) => {
	return (
		<>
			<Box marginBottom={1}>
				<Breadcrumbs root={root} breadcrumbs={breadcrumbs} />
			</Box>
			<Box flexDirection="column" display={isTweets ? "flex" : "none"}>
				<Timeline
					tweets={tweets}
					onSelect={onSelect}
					onHighlight={onHighlight}
					limit={limit}
					isFocused={isTweets}
				/>
			</Box>
			{!isTweets && <TweetDetail tweet={tweet} updater={updater} />}
		</>
	);
};
