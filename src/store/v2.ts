import { atom } from "jotai";
import type { TwitterApi, ListTimelineV1Paginator } from "twitter-api-v2";
import { UserConfig } from "../types";

export const userConfigAtom = atom<UserConfig | null>(null);

export const twitterClientAtom = atom<TwitterApi | null>(null);

export const listPaginatorAtom = atom<ListTimelineV1Paginator | null>(null);
