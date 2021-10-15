import { atom } from "jotai";
import type { TwitterApi } from "twitter-api-v2";
import { AppConfigV2 } from "../types";

export const userConfigAtom = atom<AppConfigV2 | null>(null);

export const twitterClientAtom = atom<TwitterApi | null>(null);
