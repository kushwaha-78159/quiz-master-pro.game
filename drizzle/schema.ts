import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  coins: int("coins").default(0).notNull(),
  xp: int("xp").default(0).notNull(),
  level: int("level").default(1).notNull(),
  activeCharacterId: int("activeCharacterId"),
  totalScore: int("totalScore").default(0).notNull(),
  gamesPlayed: int("gamesPlayed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Characters table - pre-defined cyberpunk avatars
export const characters = mysqlTable("characters", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 512 }),
  unlockCost: int("unlockCost").default(0).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;

// Player characters - tracks which characters each user owns
export const playerCharacters = mysqlTable("playerCharacters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  characterId: int("characterId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type PlayerCharacter = typeof playerCharacters.$inferSelect;
export type InsertPlayerCharacter = typeof playerCharacters.$inferInsert;

// Questions table
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 64 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard", "expert"]).notNull(),
  question: text("question").notNull(),
  correctAnswer: varchar("correctAnswer", { length: 512 }).notNull(),
  optionA: varchar("optionA", { length: 512 }).notNull(),
  optionB: varchar("optionB", { length: 512 }).notNull(),
  optionC: varchar("optionC", { length: 512 }).notNull(),
  optionD: varchar("optionD", { length: 512 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

// Quiz sessions - tracks active and completed quiz games
export const quizSessions = mysqlTable("quizSessions", {
  id: int("id").autoincrement().primaryKey(),
  roomId: varchar("roomId", { length: 64 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard", "expert"]).notNull(),
  status: mysqlEnum("status", ["lobby", "active", "completed"]).default("lobby").notNull(),
  currentQuestionIndex: int("currentQuestionIndex").default(0).notNull(),
  totalQuestions: int("totalQuestions").default(10).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
});

export type QuizSession = typeof quizSessions.$inferSelect;
export type InsertQuizSession = typeof quizSessions.$inferInsert;

// Player answers - tracks user responses during quiz
export const playerAnswers = mysqlTable("playerAnswers", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  questionId: int("questionId").notNull(),
  selectedAnswer: varchar("selectedAnswer", { length: 512 }).notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  coinsEarned: int("coinsEarned").default(0).notNull(),
  xpEarned: int("xpEarned").default(0).notNull(),
  timeSpent: int("timeSpent").default(0).notNull(),
  answeredAt: timestamp("answeredAt").defaultNow().notNull(),
});

export type PlayerAnswer = typeof playerAnswers.$inferSelect;
export type InsertPlayerAnswer = typeof playerAnswers.$inferInsert;

// Chat messages - tracks in-game chat
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  roomId: varchar("roomId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Session participants - tracks players in each quiz session
export const sessionParticipants = mysqlTable("sessionParticipants", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  score: int("score").default(0).notNull(),
  coinsEarned: int("coinsEarned").default(0).notNull(),
  xpEarned: int("xpEarned").default(0).notNull(),
  rank: int("rank"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type SessionParticipant = typeof sessionParticipants.$inferSelect;
export type InsertSessionParticipant = typeof sessionParticipants.$inferInsert;