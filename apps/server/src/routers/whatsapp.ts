import { EventEmitter } from "node:events";
import type WAWebJS from "whatsapp-web.js";
import { z } from "zod/v4";
import {
  client,
  messageEvents,
  whatsappClientState,
} from "@/lib/whatsapp/client";
import { publicProcedure } from "../lib/orpc";

const sendMessageEvent = new EventEmitter();

export const whatsappRouter = {
  qrCodeSSE: publicProcedure.handler(async function* () {
    while (true) {
      yield whatsappClientState.qrCode;
      if (whatsappClientState.isReady) return;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }),
  isReadySSE: publicProcedure.handler(async function* () {
    while (true) {
      yield whatsappClientState.isReady;
      if (whatsappClientState.isReady) return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }),
  messagesSSE: publicProcedure.handler(async function* () {
    const queue: WAWebJS.Message[] = [];
    let resolve: ((value: unknown) => void) | undefined;

    const listener = (message: WAWebJS.Message) => {
      queue.push(message);
      if (resolve) {
        resolve(undefined);
        resolve = undefined;
      }
    };

    messageEvents.on("newMessage", listener);

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          await new Promise((r) => (resolve = r));
        }
      }
    } finally {
      messageEvents.removeListener("newMessage", listener);
    }
  }),

  getContact: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const contact = await client.getContactById(input.id);
      return contact;
    }),

  getPfp: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const pfp = await client.getProfilePicUrl(input.id);
      return pfp;
    }),

  getQuotedMessage: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const message = await client.getMessageById(input.id);
      const quotedMessage = await message.getQuotedMessage();
      return quotedMessage;
    }),

  sendMessage: publicProcedure
    .input(
      z.object({
        to: z.string(),
        body: z.string(),
        quotedMessageId: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      console.log(input);
      const sentMessage = await client.sendMessage(input.to, input.body, {
        quotedMessageId: input.quotedMessageId,
      });
      messageEvents.emit("newMessage", sentMessage);
      return sentMessage;
    }),
};
export type WhatsappRouter = typeof whatsappRouter;
