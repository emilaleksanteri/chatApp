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

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { TRPCClientError } from '@trpc/client';
import { TRPCError } from '@trpc/server';

// Create a new ratelimiter, that allows 12 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(12, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

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
    .input(
      z.object({
        body: z
          .string()
          .min(1, { message: 'message too short' })
          .max(255, { message: 'message too long' }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const { success } = await ratelimit.limit(userId);
      if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });

      const post = await ctx.prisma.message.create({
        data: {
          userId,
          body: input.body,
        },
      });

      return post;
    }),
});
