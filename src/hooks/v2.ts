import { useAtom, SetStateAction } from "jotai";
import type {
	TwitterApi,
	ListV1,
	ListStatusesV1Params,
	ListTimelineV1Paginator,
} from "twitter-api-v2";
import type { AppConfigV2, HandledResponseError } from "../types";
import { twitterClientAtom, userConfigAtom } from "../store";
import { handleResponseError } from "../lib/helpers";

export const useUserConfig = (): [
	AppConfigV2 | null,
	(update?: SetStateAction<AppConfigV2>) => void
] => useAtom(userConfigAtom);

type PromiseWithError<T> = Promise<T | HandledResponseError>;

interface ClientApi {
	getLists: () => PromiseWithError<ListV1[]>;
	getListTimeline: (
		params: ListStatusesV1Params
	) => PromiseWithError<ListTimelineV1Paginator>;
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
	const getListTimeline = async (params: ListStatusesV1Params) => {
		try {
			return await api.listStatuses(params);
		} catch (error) {
			return handleResponseError(error, "GET", "lists/statuses");
		}
	};

	return {
		getLists,
		getListTimeline,
	};
};
