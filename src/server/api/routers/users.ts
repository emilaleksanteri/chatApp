import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { TRPCError } from '@trpc/server';

import { User, clerkClient } from '@clerk/nextjs/dist/api';
import { z } from 'zod';

import { createTRPCRouter, privateProcedure } from '~/server/api/trpc';

const filterUserForClient = (users: User) => {
  return {
    id: users.id,
    username: users.username,
    profileImageUrl: users.profileImageUrl,
  };
};

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(12, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

export const userRouter = createTRPCRouter({
  getAll: privateProcedure.query(async ({ ctx }) => {
    const { success } = await ratelimit.limit(ctx.userId);
    if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });

    const users = (await clerkClient.users.getUserList())
      .map(filterUserForClient)
      .filter((user) => user.id !== ctx.userId);

    return users;
  }),
});
