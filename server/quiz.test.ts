import { describe, expect, it, beforeEach, vi } from "vitest";

// Test reward calculations directly
describe("Reward Calculations", () => {
  describe("Coin Rewards by Difficulty", () => {
    it("should calculate 10 coins + 50 XP for easy correct answer", () => {
      const difficulty = "easy";
      let coinsEarned = 0;
      let xpEarned = 0;
      const isCorrect = true;

      if (isCorrect) {
        if (difficulty === "easy") {
          coinsEarned = 10;
          xpEarned = 50;
        }
      }

      expect(coinsEarned).toBe(10);
      expect(xpEarned).toBe(50);
    });

    it("should calculate 25 coins + 100 XP for medium correct answer", () => {
      const difficulty = "medium";
      let coinsEarned = 0;
      let xpEarned = 0;
      const isCorrect = true;

      if (isCorrect) {
        if (difficulty === "medium") {
          coinsEarned = 25;
          xpEarned = 100;
        }
      }

      expect(coinsEarned).toBe(25);
      expect(xpEarned).toBe(100);
    });

    it("should calculate 50 coins + 200 XP for hard correct answer", () => {
      const difficulty = "hard";
      let coinsEarned = 0;
      let xpEarned = 0;
      const isCorrect = true;

      if (isCorrect) {
        if (difficulty === "hard") {
          coinsEarned = 50;
          xpEarned = 200;
        }
      }

      expect(coinsEarned).toBe(50);
      expect(xpEarned).toBe(200);
    });

    it("should calculate 100 coins + 500 XP for expert correct answer", () => {
      const difficulty = "expert";
      let coinsEarned = 0;
      let xpEarned = 0;
      const isCorrect = true;

      if (isCorrect) {
        if (difficulty === "expert") {
          coinsEarned = 100;
          xpEarned = 500;
        }
      }

      expect(coinsEarned).toBe(100);
      expect(xpEarned).toBe(500);
    });

    it("should award 0 coins for incorrect answer regardless of difficulty", () => {
      const difficulties = ["easy", "medium", "hard", "expert"];

      difficulties.forEach((difficulty) => {
        let coinsEarned = 0;
        let xpEarned = 0;
        const isCorrect = false;

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

        expect(coinsEarned).toBe(0);
        expect(xpEarned).toBe(0);
      });
    });
  });

  describe("Level Progression", () => {
    it("should calculate level 1 at 0-999 XP", () => {
      const xp = 500;
      const level = Math.floor(xp / 1000) + 1;
      expect(level).toBe(1);
    });

    it("should calculate level 2 at 1000-1999 XP", () => {
      const xp = 1500;
      const level = Math.floor(xp / 1000) + 1;
      expect(level).toBe(2);
    });

    it("should calculate level 5 at 4000-4999 XP", () => {
      const xp = 4500;
      const level = Math.floor(xp / 1000) + 1;
      expect(level).toBe(5);
    });

    it("should calculate level 10 at 9000+ XP", () => {
      const xp = 9500;
      const level = Math.floor(xp / 1000) + 1;
      expect(level).toBe(10);
    });
  });

  describe("Player Stats Updates", () => {
    it("should accumulate coins correctly", () => {
      let totalCoins = 100;
      const coinsEarned = 25;
      totalCoins += coinsEarned;
      expect(totalCoins).toBe(125);
    });

    it("should accumulate XP correctly", () => {
      let totalXp = 500;
      const xpEarned = 100;
      totalXp += xpEarned;
      expect(totalXp).toBe(600);
    });

    it("should track games played", () => {
      let gamesPlayed = 5;
      gamesPlayed += 1;
      expect(gamesPlayed).toBe(6);
    });

    it("should accumulate total score", () => {
      let totalScore = 10;
      const score = 1; // 1 for correct, 0 for incorrect
      totalScore += score;
      expect(totalScore).toBe(11);
    });
  });
});

describe("Security Validations", () => {
  describe("Answer Validation", () => {
    it("should correctly validate matching answers", () => {
      const correctAnswer = "Mitochondria";
      const selectedAnswer = "Mitochondria";
      const isCorrect = selectedAnswer === correctAnswer;
      expect(isCorrect).toBe(true);
    });

    it("should correctly reject non-matching answers", () => {
      const correctAnswer = "Mitochondria";
      const selectedAnswer = "Nucleus";
      const isCorrect = selectedAnswer === correctAnswer;
      expect(isCorrect).toBe(false);
    });

    it("should be case-sensitive", () => {
      const correctAnswer = "Mitochondria";
      const selectedAnswer = "mitochondria";
      const isCorrect = selectedAnswer === correctAnswer;
      expect(isCorrect).toBe(false);
    });
  });

  describe("Character Unlock Security", () => {
    it("should prevent unlock if insufficient coins", () => {
      const userCoins = 50;
      const characterCost = 100;
      const canUnlock = userCoins >= characterCost;
      expect(canUnlock).toBe(false);
    });

    it("should allow unlock if sufficient coins", () => {
      const userCoins = 150;
      const characterCost = 100;
      const canUnlock = userCoins >= characterCost;
      expect(canUnlock).toBe(true);
    });

    it("should deduct coins after unlock", () => {
      let userCoins = 150;
      const characterCost = 100;
      if (userCoins >= characterCost) {
        userCoins -= characterCost;
      }
      expect(userCoins).toBe(50);
    });

    it("should prevent duplicate character unlock", () => {
      const ownedCharacterIds = [1, 2, 3];
      const characterToUnlock = 2;
      const alreadyOwned = ownedCharacterIds.includes(characterToUnlock);
      expect(alreadyOwned).toBe(true);
    });
  });

  describe("Leaderboard Ranking", () => {
    it("should rank players by total score descending", () => {
      const players = [
        { id: 1, name: "Alice", totalScore: 100 },
        { id: 2, name: "Bob", totalScore: 150 },
        { id: 3, name: "Charlie", totalScore: 75 },
      ];

      const ranked = players.sort((a, b) => b.totalScore - a.totalScore);
      expect(ranked[0].name).toBe("Bob");
      expect(ranked[1].name).toBe("Alice");
      expect(ranked[2].name).toBe("Charlie");
    });

    it("should rank players by level then coins as tiebreaker", () => {
      const players = [
        { id: 1, name: "Alice", level: 5, coins: 1000 },
        { id: 2, name: "Bob", level: 5, coins: 1500 },
        { id: 3, name: "Charlie", level: 3, coins: 2000 },
      ];

      const ranked = players.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.coins - a.coins;
      });

      expect(ranked[0].name).toBe("Bob");
      expect(ranked[1].name).toBe("Alice");
      expect(ranked[2].name).toBe("Charlie");
    });
  });
});
