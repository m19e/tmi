import { atom } from "jotai";
import { Column } from "../types";

export const columnMapAtom = atom(
	new Map<string, Column>([
		["home", { type: "home", name: "home", timeline: [] }],
		["mentions", { type: "mentions", name: "mentions", timeline: [] }],
	])
);

export const requestResultAtom = atom<string | undefined>(undefined);

export const errorAtom = atom<string | undefined>(undefined);

export const hintAtom = atom<string | undefined>(undefined);
