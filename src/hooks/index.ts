import { useAtom } from "jotai";

import { userIdAtom } from "../store";

export const useUserId = () => useAtom(userIdAtom);
