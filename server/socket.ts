import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { users, chatMessages, quizSessions, sessionParticipants } from "../drizzle/schema";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userName?: string;
  roomId?: string;
}

export function initializeSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? undefined : "*",
      methods: ["GET", "POST"],
    },
  });

  // Middleware to authenticate socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;

      if (!userId) {
        return next(new Error("Authentication error"));
      }

      const db = await getDb();
      if (!db) {
        return next(new Error("Database unavailable"));
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        return next(new Error("User not found"));
      }

      socket.userId = userId;
      socket.userName = user[0].name || `Player_${userId}`;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  // Connection event
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`[Socket.io] User ${socket.userName} (${socket.userId}) connected`);

    // Broadcast online status
    io.emit("user_online", {
      userId: socket.userId,
      userName: socket.userName,
      timestamp: new Date(),
    });

    // ============ LOBBY EVENTS ============

    socket.on("create_room", async (data: { category: string; difficulty: string }) => {
      try {
        const db = await getDb();
        if (!db || !socket.userId) return;

        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const session = await db.insert(quizSessions).values({
          roomId,
          category: data.category,
          difficulty: data.difficulty as "easy" | "medium" | "hard" | "expert",
          createdBy: socket.userId,
          status: "lobby",
        });

        socket.join(roomId);
        socket.roomId = roomId;

        io.to(roomId).emit("room_created", {
          roomId,
          category: data.category,
          difficulty: data.difficulty,
          createdBy: socket.userName,
          players: [{ userId: socket.userId, userName: socket.userName }],
          timestamp: new Date(),
        });

        socket.emit("room_joined", { roomId, status: "success" });
      } catch (error) {
        console.error("[Socket.io] Error creating room:", error);
        socket.emit("error", { message: "Failed to create room" });
      }
    });

    socket.on("join_room", async (data: { roomId: string }) => {
      try {
        const db = await getDb();
        if (!db || !socket.userId) return;

        const session = await db
          .select()
          .from(quizSessions)
          .where(eq(quizSessions.roomId, data.roomId))
          .limit(1);

        if (session.length === 0) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Add participant to session
        await db.insert(sessionParticipants).values({
          sessionId: session[0].id,
          userId: socket.userId,
          score: 0,
        });

        socket.join(data.roomId);
        socket.roomId = data.roomId;

        io.to(data.roomId).emit("player_joined", {
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date(),
        });

        socket.emit("room_joined", { roomId: data.roomId, status: "success" });
      } catch (error) {
        console.error("[Socket.io] Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("leave_room", async () => {
      if (socket.roomId) {
        io.to(socket.roomId).emit("player_left", {
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date(),
        });
        socket.leave(socket.roomId);
        socket.roomId = undefined;
      }
    });

    socket.on("get_rooms", async () => {
      try {
        const db = await getDb();
        if (!db) return;

        const activeSessions = await db
          .select()
          .from(quizSessions)
          .where(eq(quizSessions.status, "lobby"));

        const rooms = activeSessions.map((session) => ({
          roomId: session.roomId,
          category: session.category,
          difficulty: session.difficulty,
          createdBy: session.createdBy,
          playerCount: 1, // Will be updated with actual count
        }));

        socket.emit("rooms_list", { rooms, timestamp: new Date() });
      } catch (error) {
        console.error("[Socket.io] Error fetching rooms:", error);
      }
    });

    // ============ CHAT EVENTS ============

    socket.on("send_message", async (data: { message: string }) => {
      try {
        if (!socket.roomId || !socket.userId) return;

        const db = await getDb();
        if (!db) return;

        // Save message to database
        await db.insert(chatMessages).values({
          roomId: socket.roomId,
          userId: socket.userId,
          message: data.message,
        });

        // Broadcast message to room
        io.to(socket.roomId).emit("message_received", {
          userId: socket.userId,
          userName: socket.userName,
          message: data.message,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[Socket.io] Error sending message:", error);
      }
    });

    socket.on("get_chat_history", async (data: { roomId: string }) => {
      try {
        const db = await getDb();
        if (!db) return;

        const messages = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.roomId, data.roomId));

        socket.emit("chat_history", { messages, timestamp: new Date() });
      } catch (error) {
        console.error("[Socket.io] Error fetching chat history:", error);
      }
    });

    // ============ GAME EVENTS ============

    socket.on("start_quiz", async () => {
      try {
        if (!socket.roomId) return;

        const db = await getDb();
        if (!db) return;

        const session = await db
          .select()
          .from(quizSessions)
          .where(eq(quizSessions.roomId, socket.roomId))
          .limit(1);

        if (session.length === 0) return;

        // Update session status to active
        await db
          .update(quizSessions)
          .set({ status: "active", startedAt: new Date() })
          .where(eq(quizSessions.id, session[0].id));

        io.to(socket.roomId).emit("quiz_started", {
          roomId: socket.roomId,
          totalQuestions: session[0].totalQuestions,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[Socket.io] Error starting quiz:", error);
      }
    });

    socket.on("submit_answer", async (data: { questionId: number; answer: string; isCorrect: boolean; coinsEarned: number; xpEarned: number }) => {
      try {
        if (!socket.roomId || !socket.userId) return;

        const db = await getDb();
        if (!db) return;

        // Update user coins and XP
        const user = await db.select().from(users).where(eq(users.id, socket.userId)).limit(1);
        if (user.length === 0) return;

        const newCoins = user[0].coins + data.coinsEarned;
        const newXp = user[0].xp + data.xpEarned;
        const newLevel = Math.floor(newXp / 1000) + 1; // Level up every 1000 XP

        await db
          .update(users)
          .set({ coins: newCoins, xp: newXp, level: newLevel })
          .where(eq(users.id, socket.userId));

        // Broadcast answer to room
        io.to(socket.roomId).emit("answer_submitted", {
          userId: socket.userId,
          userName: socket.userName,
          isCorrect: data.isCorrect,
          coinsEarned: data.coinsEarned,
          xpEarned: data.xpEarned,
          timestamp: new Date(),
        });

        // Emit updated user stats
        socket.emit("stats_updated", {
          coins: newCoins,
          xp: newXp,
          level: newLevel,
        });
      } catch (error) {
        console.error("[Socket.io] Error submitting answer:", error);
      }
    });

    socket.on("end_quiz", async () => {
      try {
        if (!socket.roomId) return;

        const db = await getDb();
        if (!db) return;

        const session = await db
          .select()
          .from(quizSessions)
          .where(eq(quizSessions.roomId, socket.roomId))
          .limit(1);

        if (session.length === 0) return;

        // Update session status to completed
        await db
          .update(quizSessions)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(quizSessions.id, session[0].id));

        io.to(socket.roomId).emit("quiz_ended", {
          roomId: socket.roomId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[Socket.io] Error ending quiz:", error);
      }
    });

    // ============ LEADERBOARD EVENTS ============

    socket.on("get_leaderboard", async () => {
      try {
        const db = await getDb();
        if (!db) return;

        const leaderboard = await db
          .select()
          .from(users)
          .orderBy((u) => [u.totalScore, u.level, u.coins])
          .limit(100);

        socket.emit("leaderboard_data", {
          leaderboard: leaderboard.map((u, idx) => ({
            rank: idx + 1,
            userId: u.id,
            userName: u.name,
            score: u.totalScore,
            level: u.level,
            coins: u.coins,
          })),
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[Socket.io] Error fetching leaderboard:", error);
      }
    });

    // Broadcast leaderboard updates to all connected clients
    socket.on("broadcast_leaderboard_update", async () => {
      try {
        const db = await getDb();
        if (!db) return;

        const leaderboard = await db
          .select()
          .from(users)
          .orderBy((u) => [u.totalScore, u.level, u.coins])
          .limit(100);

        io.emit("leaderboard_updated", {
          leaderboard: leaderboard.map((u, idx) => ({
            rank: idx + 1,
            userId: u.id,
            userName: u.name,
            score: u.totalScore,
            level: u.level,
            coins: u.coins,
          })),
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[Socket.io] Error broadcasting leaderboard:", error);
      }
    });

    // ============ DISCONNECT EVENT ============

    socket.on("disconnect", () => {
      console.log(`[Socket.io] User ${socket.userName} (${socket.userId}) disconnected`);

      if (socket.roomId) {
        io.to(socket.roomId).emit("player_left", {
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date(),
        });
      }

      io.emit("user_offline", {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date(),
      });
    });
  });

  return io;
}
