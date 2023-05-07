import { createTRPCRouter } from '~/server/api/trpc';
import { messagesRouter } from '~/server/api/routers/message';
import { chatsRouter } from '~/server/api/routers/chats';
import { userRouter } from '~/server/api/routers/users';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  message: messagesRouter,
  chats: chatsRouter,
  users: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
