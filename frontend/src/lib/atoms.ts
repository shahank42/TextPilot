import { atom } from "jotai";
import { enableMapSet } from "immer";
import { atomWithImmer } from "jotai-immer";
import type { ModelsMessage } from "./api-client";

enableMapSet();

export const qrCodeAtom = atom<string | null>(null);
export const selectedChatIdAtom = atom<string | null>(null);
export const messageMapAtom = atomWithImmer(
  new Map<string, ModelsMessage[]>()
);