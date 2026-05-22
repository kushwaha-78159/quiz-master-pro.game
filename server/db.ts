import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, characters, playerCharacters, questions, quizSessions, sessionParticipants } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Quiz queries
export async function getQuestionsByCategory(category: string, difficulty: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(questions)
    .where(and(eq(questions.category, category), eq(questions.difficulty, difficulty as any)))
    .limit(limit);
}

// Character queries
export async function getAllCharacters() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(characters);
}

export async function getUserCharacters(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(playerCharacters)
    .where(eq(playerCharacters.userId, userId));
}

export async function unlockCharacter(userId: number, characterId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(playerCharacters).values({
      userId,
      characterId,
    });
    return true;
  } catch (error) {
    console.error("Error unlocking character:", error);
    return false;
  }
}

// Leaderboard queries
export async function getLeaderboard(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(users)
    .orderBy(desc(users.totalScore), desc(users.level), desc(users.coins))
    .limit(limit);
}

// Player stats update
export async function updatePlayerStats(userId: number, coinsEarned: number, xpEarned: number, score: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) return false;

    const newCoins = user[0].coins + coinsEarned;
    const newXp = user[0].xp + xpEarned;
    const newLevel = Math.floor(newXp / 1000) + 1;
    const newTotalScore = user[0].totalScore + score;
    const newGamesPlayed = user[0].gamesPlayed + 1;

    await db
      .update(users)
      .set({
        coins: newCoins,
        xp: newXp,
        level: newLevel,
        totalScore: newTotalScore,
        gamesPlayed: newGamesPlayed,
      })
      .where(eq(users.id, userId));

    return true;
  } catch (error) {
    console.error("Error updating player stats:", error);
    return false;
  }
}

// Server-side answer validation (prevents client-side cheating)
export async function validateAndRewardAnswer(
  userId: number,
  questionId: number,
  selectedAnswer: string,
  difficulty: string
): Promise<{ isCorrect: boolean; coinsEarned: number; xpEarned: number }> {
  const db = await getDb();
  if (!db) return { isCorrect: false, coinsEarned: 0, xpEarned: 0 };

  try {
    const question = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (!question || question.length === 0) {
      return { isCorrect: false, coinsEarned: 0, xpEarned: 0 };
    }

    const q = question[0];
    const isCorrect = selectedAnswer === q.correctAnswer;

    let coinsEarned = 0;
    let xpEarned = 0;

    if (isCorrect) {
      if (difficulty === "easy") {
        coinsEarned = 10;
        xpEarned = 50;
      } else if (difficulty === "medium") {
        coinsEarned = 25;
        xpEarned = 100;
      } else if (difficulty === "hard") {
        coinsEarned = 50;
        xpEarned = 200;
      } else if (difficulty === "expert") {
        coinsEarned = 100;
        xpEarned = 500;
      }
    }

    return { isCorrect, coinsEarned, xpEarned };
  } catch (error) {
    console.error("[Database] Failed to validate answer:", error);
    return { isCorrect: false, coinsEarned: 0, xpEarned: 0 };
  }
}

// Secure character unlock with coin deduction
export async function unlockCharacterSecure(
  userId: number,
  characterId: number
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database unavailable" };

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return { success: false, message: "User not found" };
    }

    const character = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (!character || character.length === 0) {
      return { success: false, message: "Character not found" };
    }

    const cost = character[0].unlockCost;
    if (user[0].coins < cost) {
      return { success: false, message: "Insufficient coins" };
    }

    const alreadyOwned = await db
      .select()
      .from(playerCharacters)
      .where(
        and(
          eq(playerCharacters.userId, userId),
          eq(playerCharacters.characterId, characterId)
        )
      )
      .limit(1);

    if (alreadyOwned && alreadyOwned.length > 0) {
      return { success: false, message: "Character already unlocked" };
    }

    await db.insert(playerCharacters).values({
      userId,
      characterId,
    });

    await db
      .update(users)
      .set({ coins: user[0].coins - cost })
      .where(eq(users.id, userId));

    return { success: true, message: "Character unlocked successfully" };
  } catch (error) {
    console.error("[Database] Failed to unlock character:", error);
    return { success: false, message: "Failed to unlock character" };
  }
}
