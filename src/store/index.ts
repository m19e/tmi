import { atom } from "jotai";
import type Twitter from "twitter-lite";

export const userIdAtom = atom("");

export const clientAtom = atom<Twitter | null>(null);
