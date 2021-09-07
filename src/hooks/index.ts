import { useAtom, SetStateAction } from "jotai";
import type Twitter from "twitter-lite";

import { userIdAtom, clientAtom } from "../store";

export const useUserId = () => useAtom(userIdAtom);

export const useClient = (): [
	Twitter | null,
	(update?: SetStateAction<Twitter | null>) => void
] => useAtom(clientAtom);

export const getClient = () => useAtom(clientAtom)[0];
