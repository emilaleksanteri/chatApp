import { User, clerkClient } from '@clerk/nextjs/dist/api';
import { z } from 'zod';
import AIPic from '../../../../public/origin.jpg';

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from '~/server/api/trpc';

import { Configuration, OpenAIApi } from 'openai';

// config for ai anwsers
const configuration = new Configuration({
  organization: 'org-VH90biEnCK2gyFHj3909q8HS',
  apiKey: process.env.NEXT_PUBLIC_chat_api,
});

const opneai = new OpenAIApi(configuration);

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
  // takes in chatId
  getAll: privateProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const messages = await ctx.prisma.message.findMany({
      take: 100,
      where: {
        chatId: input,
      },
      include: {
        chat: true,
      },
    });

    const users = (
      await clerkClient.users.getUserList({
        userId: messages.map((message) => message.userId),
        limit: 100,
      })
    )
      .map(filterUserForClient)
      .concat({
        id: 'AI',
        username: 'AI',
        profileImageUrl: '/origin.jpg',
      });

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
        chatId: z.string(),
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
          chatId: input.chatId,
        },
      });

      return post;
    }),

  aiMessage: privateProcedure
    .input(
      z.object({
        body: z.string(),
        chatId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prompt = input.body.slice(3);

      if (!prompt) {
        console.log('no prompt');
        return;
      }

      const response = await opneai.createCompletion({
        model: 'text-davinci-003',
        prompt: prompt + ' in less than 255 characters',
        max_tokens: 300,
      });

      const aiResponse: string | undefined = response.data.choices[0]?.text;
      console.log(aiResponse);

      if (!aiResponse) {
        console.log('no ai response');
        return;
      }

      const newPost = await ctx.prisma.message.create({
        data: {
          userId: 'AI',
          body: aiResponse,
          chatId: input.chatId,
        },
      });

      return newPost;
    }),
});
