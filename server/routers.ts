import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getQuestionsByCategory, getAllCharacters, getUserCharacters, getLeaderboard, updatePlayerStats, validateAndRewardAnswer, unlockCharacterSecure } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    profile: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      return {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        coins: ctx.user.coins,
        xp: ctx.user.xp,
        level: ctx.user.level,
        totalScore: ctx.user.totalScore,
        gamesPlayed: ctx.user.gamesPlayed,
        createdAt: ctx.user.createdAt,
      };
    }),
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
      .input(z.object({ questionId: z.number(), selectedAnswer: z.string(), difficulty: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) return { success: false, isCorrect: false, coinsEarned: 0, xpEarned: 0 };
        
        // Server-side validation prevents client-side cheating
        const validation = await validateAndRewardAnswer(
          ctx.user.id,
          input.questionId,
          input.selectedAnswer,
          input.difficulty
        );
        
        // Update player stats only if answer is correct or rewards are earned
        if (validation.isCorrect || validation.coinsEarned > 0) {
          await updatePlayerStats(
            ctx.user.id,
            validation.coinsEarned,
            validation.xpEarned,
            validation.isCorrect ? 1 : 0
          );
        }
        
        return { success: true, ...validation };
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
        if (!ctx.user) return { success: false, message: "Not authenticated" };
        // Secure unlock with coin deduction and validation
        return await unlockCharacterSecure(ctx.user.id, input.characterId);
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
