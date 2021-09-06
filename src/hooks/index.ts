import { useAtom } from "jotai";

import { userIdAtom, clientAtom } from "../store";

export const useUserId = () => useAtom(userIdAtom);

export const useClient = () => useAtom(clientAtom);
