import { atom } from "jotai";
import type WAWebJS from "whatsapp-web.js";

export const whatsappMessagesAtom = atom<WAWebJS.Message[]>([]);
export const selectedChatIdAtom = atom<string | null>(null);
