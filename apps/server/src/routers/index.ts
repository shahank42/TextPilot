import { publicProcedure } from "../lib/orpc";
import { whatsappRouter } from "./whatsapp";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  whatsapp: whatsappRouter,
};
export type AppRouter = typeof appRouter;
