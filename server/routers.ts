import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getQuestionsByCategory, getAllCharacters, getUserCharacters, unlockCharacter, getLeaderboard, updatePlayerStats } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  quiz: router({
    getQuestions: publicProcedure
      .input(z.object({ category: z.string(), difficulty: z.string(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return await getQuestionsByCategory(input.category, input.difficulty, input.limit);
      }),
    submitAnswer: protectedProcedure
      .input(z.object({ questionId: z.number(), selectedAnswer: z.string(), isCorrect: z.boolean(), coinsEarned: z.number(), xpEarned: z.number(), score: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) return { success: false };
        const result = await updatePlayerStats(ctx.user.id, input.coinsEarned, input.xpEarned, input.score);
        return { success: result };
      }),
  }),

  characters: router({
    getAll: publicProcedure.query(async () => {
      return await getAllCharacters();
    }),
    getUserCharacters: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return await getUserCharacters(ctx.user.id);
    }),
    unlock: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) return { success: false };
        const result = await unlockCharacter(ctx.user.id, input.characterId);
        return { success: result };
      }),
  }),

  leaderboard: router({
    getTop: publicProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return await getLeaderboard(input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
