import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Trophy, Zap } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  score: number;
  level: number;
  coins: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { on, off } = useSocket();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "level" | "coins">("score");

  const leaderboardQuery = trpc.leaderboard.getTop.useQuery({ limit: 100 });

  useEffect(() => {
    if (leaderboardQuery.data) {
      const sorted = [...leaderboardQuery.data].sort((a, b) => {
        if (sortBy === "score") return b.totalScore - a.totalScore;
        if (sortBy === "level") return b.level - a.level;
        return b.coins - a.coins;
      });

      const withRanks = sorted.map((entry, idx) => ({
        rank: idx + 1,
        userId: entry.id,
        userName: entry.name || `Player_${entry.id}`,
        score: entry.totalScore,
        level: entry.level,
        coins: entry.coins,
      }));

      setLeaderboard(withRanks);

      if (user) {
        const userEntry = withRanks.find((e) => e.userId === user.id);
        setUserRank(userEntry?.rank || null);
      }
    }
  }, [leaderboardQuery.data, sortBy, user]);

  useEffect(() => {
    const handleLeaderboardUpdate = (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
      if (user) {
        const userEntry = data.leaderboard.find((e) => e.userId === user.id);
        setUserRank(userEntry?.rank || null);
      }
    };

    on("leaderboard_updated", handleLeaderboardUpdate);

    return () => {
      off("leaderboard_updated", handleLeaderboardUpdate);
    };
  }, [on, off, user]);

  const getRankMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden scan-lines">
      <header className="border-b border-cyan-500 bg-black/80 backdrop-blur sticky top-0 z-10">
        <div className="container py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-cyan-400 neon-glow-cyan" />
            <h1 className="text-3xl font-bold neon-glow-cyan">LEADERBOARD</h1>
          </div>
          <Button onClick={() => navigate("/")} className="btn-neon text-sm">
            BACK HOME
          </Button>
        </div>
      </header>

      <main className="container py-12">
        {user && userRank && (
          <div className="mb-12 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border-2 border-cyan-500 p-6 rounded">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-cyan-400 text-sm mb-2">YOUR RANK</p>
                <p className="text-3xl font-bold neon-glow-cyan">#{userRank}</p>
              </div>
              <div className="text-right">
                <p className="text-pink-400 text-sm mb-2">YOUR SCORE</p>
                <p className="text-3xl font-bold neon-glow">{user.totalScore}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-8">
          {(["score", "level", "coins"] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-6 py-2 font-bold uppercase text-sm transition-all ${
                sortBy === sort
                  ? "bg-cyan-500 text-black border-2 border-cyan-300"
                  : "bg-black border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
              }`}
            >
              Sort by {sort.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="bg-black/50 border-2 border-cyan-500 rounded overflow-hidden hud-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-500 bg-black/80">
                  <th className="px-6 py-4 text-left text-cyan-400 font-bold">RANK</th>
                  <th className="px-6 py-4 text-left text-cyan-400 font-bold">PLAYER</th>
                  <th className="px-6 py-4 text-center text-cyan-400 font-bold">LEVEL</th>
                  <th className="px-6 py-4 text-center text-cyan-400 font-bold">SCORE</th>
                  <th className="px-6 py-4 text-center text-cyan-400 font-bold">COINS</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => {
                  const medal = getRankMedal(entry.rank);
                  const isCurrentUser = user && entry.userId === user.id;

                  return (
                    <tr
                      key={entry.userId}
                      className={`border-b border-cyan-500/30 transition-all ${
                        isCurrentUser
                          ? "bg-cyan-500/20 hover:bg-cyan-500/30"
                          : idx % 2 === 0
                          ? "bg-black/30 hover:bg-black/50"
                          : "hover:bg-black/50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {medal && <span className="text-2xl">{medal}</span>}
                          <span
                            className={`font-bold ${
                              entry.rank === 1
                                ? "text-yellow-400 neon-glow"
                                : entry.rank === 2
                                ? "text-gray-300"
                                : entry.rank === 3
                                ? "text-orange-400"
                                : "text-cyan-400"
                            }`}
                          >
                            #{entry.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold ${
                            isCurrentUser ? "neon-glow-cyan" : "text-cyan-300"
                          }`}
                        >
                          {entry.userName}
                          {isCurrentUser && " (YOU)"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Zap className="w-4 h-4 text-purple-400" />
                          <span className="font-bold text-purple-400">Lvl {entry.level}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-pink-400">{entry.score}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-yellow-400">{entry.coins}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
