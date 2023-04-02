import { User, clerkClient } from '@clerk/nextjs/dist/api';
import { z } from 'zod';

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from '~/server/api/trpc';

// clerck returns a lot of fields, need to be narrowed down
const filterUserForClient = (users: User) => {
  return {
    id: users.id,
    username: users.username,
    profileImageUrl: users.profileImageUrl,
  };
};

export const messagesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const messages = await ctx.prisma.message.findMany({
      take: 100,
    });

    const users = (
      await clerkClient.users.getUserList({
        userId: messages.map((message) => message.userId),
        limit: 100,
      })
    ).map(filterUserForClient);

    return messages.map((message) => ({
      message,
      author: users.find((user) => user.id === message.userId),
    }));
  }),

  create: privateProcedure
    .input(z.object({ body: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const post = await ctx.prisma.message.create({
        data: {
          userId,
          body: input.body,
        },
      });

      return post;
    }),
});
