import { z } from 'zod';
import { User, clerkClient } from '@clerk/nextjs/dist/api';

import { createTRPCRouter, privateProcedure } from '~/server/api/trpc';
import { TRPCFetch } from '@trpc/client';

const filterUserForClient = (users: User) => {
  return {
    id: users.id,
    username: users.username,
    profileImageUrl: users.profileImageUrl,
  };
};

export const chatsRouter = createTRPCRouter({
  getAll: privateProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const userChats = await ctx.prisma.participants.findMany({
      where: {
        userId: userId,
      },
      select: {
        Chat: {
          select: {
            chatName: true,
            messages: {
              orderBy: {
                sentAt: 'desc',
              },
              take: 1,
              select: {
                body: true,
              },
            },
          },
        },
        chatId: true,
      },
    });

    return userChats;
  }),

  createChat: privateProcedure
    .input(
      z.object({
        chatName: z.string(),
        participants: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const chat = await ctx.prisma.chat.create({
        data: {
          chatName: input.chatName,
        },
      });

      await ctx.prisma.participants.createMany({
        data: input.participants.map((participant) => {
          return {
            userId: participant,
            chatId: chat.id,
          };
        }),
      });

      return 'success';
    }),

  getChatMembers: privateProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const members = await ctx.prisma.participants.findMany({
        where: {
          chatId: input,
        },
      });

      const users = (await clerkClient.users.getUserList()).map(
        filterUserForClient
      );

      return members.map((member) => ({
        user: users.find((user) => user.id === member.userId),
      }));
    }),

  getChatData: privateProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const chatData = await ctx.prisma.chat.findFirst({
        where: {
          id: input,
        },
      });

      return chatData;
    }),

  leaveChat: privateProcedure
    .input(
      z.object({
        chatId: z.string(),
        numOfUsers: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;

      if (input.numOfUsers > 1) {
        await ctx.prisma.participants.deleteMany({
          where: {
            userId: userId,
            chatId: input.chatId,
          },
        });
      } else {
        await ctx.prisma.participants.deleteMany({
          where: {
            userId: userId,
            chatId: input.chatId,
          },
        });

        await ctx.prisma.chat.deleteMany({
          where: {
            id: input.chatId,
          },
        });
      }

      return 'success';
    }),
});