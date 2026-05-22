import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Coins, Trophy, Zap, LogOut } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [xpPercentage, setXpPercentage] = useState(0);

  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    if (user) {
      const xpForCurrentLevel = (user.level - 1) * 1000;
      const xpForNextLevel = user.level * 1000;
      const xpInCurrentLevel = user.xp - xpForCurrentLevel;
      const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
      setXpPercentage((xpInCurrentLevel / xpNeededForLevel) * 100);
    }
  }, [user]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-2xl neon-glow">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden scan-lines">
      <header className="border-b border-cyan-500 bg-black/80 backdrop-blur sticky top-0 z-10">
        <div className="container py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold neon-glow-cyan">PLAYER PROFILE</h1>
          <Button onClick={() => navigate("/")} className="btn-neon text-sm">
            BACK HOME
          </Button>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black/50 border-2 border-cyan-500 p-8 rounded mb-8 hud-border">
            <div className="flex items-center gap-8 mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 rounded flex items-center justify-center text-6xl border-2 border-cyan-500">
                👤
              </div>
              <div>
                <h2 className="text-3xl font-bold neon-glow-cyan mb-2">{user.name}</h2>
                <p className="text-cyan-300 mb-4">Player ID: {user.id}</p>
                <p className="text-cyan-300">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-black/50 border-2 border-purple-500 p-6 rounded text-center" style={{ boxShadow: "0 0 10px rgba(128, 0, 255, 0.3)" }}>
              <Zap className="w-8 h-8 mx-auto mb-2" style={{ textShadow: "0 0 10px hsl(270, 100%, 50%)" }} />
              <p className="text-purple-400 text-sm mb-2">LEVEL</p>
              <p className="text-3xl font-bold" style={{ textShadow: "0 0 10px hsl(270, 100%, 50%)" }}>
                {user.level}
              </p>
            </div>

            <div className="bg-black/50 border-2 border-pink-500 p-6 rounded text-center hud-border-pink">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-pink-400" />
              <p className="text-pink-400 text-sm mb-2">TOTAL SCORE</p>
              <p className="text-3xl font-bold neon-glow">{user.totalScore}</p>
            </div>

            <div className="bg-black/50 border-2 border-yellow-500 p-6 rounded text-center">
              <Coins className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <p className="text-yellow-400 text-sm mb-2">COINS</p>
              <p className="text-3xl font-bold text-yellow-400">{user.coins}</p>
            </div>

            <div className="bg-black/50 border-2 border-cyan-500 p-6 rounded text-center hud-border">
              <span className="text-2xl mb-2 block">🎮</span>
              <p className="text-cyan-400 text-sm mb-2">GAMES PLAYED</p>
              <p className="text-3xl font-bold neon-glow-cyan">{user.gamesPlayed}</p>
            </div>
          </div>

          <div className="bg-black/50 border-2 border-cyan-500 p-6 rounded mb-8 hud-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold neon-glow-cyan">EXPERIENCE PROGRESS</h3>
              <span className="text-cyan-300 text-sm">
                {user.xp - (user.level - 1) * 1000} / {1000} XP
              </span>
            </div>
            <div className="w-full bg-black/50 rounded h-4 overflow-hidden border border-cyan-500">
              <div
                className="bg-gradient-to-r from-cyan-500 to-pink-500 h-full transition-all duration-300"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
            <p className="text-cyan-300 text-sm mt-2">
              {Math.floor(xpPercentage)}% to Level {user.level + 1}
            </p>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => navigate("/characters")} className="btn-neon-pink flex-1">
              UNLOCK CHARACTERS
            </Button>
            <Button onClick={() => navigate("/leaderboard")} className="btn-neon flex-1">
              VIEW LEADERBOARD
            </Button>
            <Button onClick={handleLogout} className="btn-neon-pink">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
