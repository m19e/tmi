import { useAtom, SetStateAction } from "jotai";
import { requestResultAtom, errorAtom, hintAtom } from "../store";
import { GetListTweetsParams, TimelineHintKey } from "../types";
import type { List, Tweet } from "../types/twitter";
import type { HandledErrorResponse } from "../lib/api";
import { hintMap } from "../consts";

type PostApiRequestWithID = (params: { id: string }) => Promise<null | string>;

interface ClientApi {
	getTweet: (params: { id: string }) => Promise<Tweet | string>;
	getUserLists: () => Promise<List[] | HandledErrorResponse>;
	getListTimeline: (params: GetListTweetsParams) => Promise<Tweet[] | string>;
	tweet: (params: { status: string }) => Promise<null | string>;
	reply: (params: {
		status: string;
		in_reply_to_status_id: string;
	}) => Promise<null | string>;
	deleteTweet: PostApiRequestWithID;
	favorite: PostApiRequestWithID;
	unfavorite: PostApiRequestWithID;
	retweet: PostApiRequestWithID;
	unretweet: PostApiRequestWithID;
}

export const useRequestResult = (): [
	string | undefined,
	(update: string) => void
] => {
	const [requestResult, setR]: [
		string | undefined,
		(update?: SetStateAction<string | undefined>) => void | Promise<void>
	] = useAtom(requestResultAtom);
	const [error, setError]: [
		string | undefined,
		(update?: SetStateAction<string | undefined>) => void | Promise<void>
	] = useAtom(errorAtom);

	const setRequestResult = (r: string) => {
		if (error) setError(undefined);
		setR(r);
	};

	return [requestResult, setRequestResult];
};

export const useError = (): [string | undefined, (update: string) => void] => {
	const [error, setE]: [
		string | undefined,
		(update?: SetStateAction<string | undefined>) => void | Promise<void>
	] = useAtom(errorAtom);
	const [requestResult, setRequestResult]: [
		string | undefined,
		(update?: SetStateAction<string | undefined>) => void | Promise<void>
	] = useAtom(requestResultAtom);

	const setError = (e: string) => {
		if (requestResult) setRequestResult(undefined);
		setE(e);
	};

	return [error, setError];
};

export const useHint = (): [
	string | undefined,
	(key: TimelineHintKey) => void
] => {
	const [hint, setHint]: [
		string | undefined,
		(update?: SetStateAction<string | undefined>) => void | Promise<void>
	] = useAtom(hintAtom);

	const setHintKey = (key: TimelineHintKey) => setHint(hintMap.get(key));

	return [hint, setHintKey];
};
