import { useAtom, SetStateAction } from "jotai";
import type { TwitterApi, ListV1 } from "twitter-api-v2";
import type { HandledResponseError } from "../types";
import { twitterClientAtom } from "../store";
import { handleResponseError } from "../lib/helpers";

type PromiseWithError<T> = Promise<T | HandledResponseError>;

interface ClientApi {
	getLists: () => PromiseWithError<ListV1[]>;
}

export const useTwitterClient = (): [
	TwitterApi | null,
	(update?: SetStateAction<TwitterApi>) => void
] => useAtom(twitterClientAtom);

export const useTwitterApi = (): ClientApi => {
	const [{ v1: api }] = useAtom(twitterClientAtom);
	const getLists = async () => {
		try {
			return await api.lists();
		} catch (error) {
			return handleResponseError(error, "GET", "lists/list");
		}
	};

	return {
		getLists,
	};
};
