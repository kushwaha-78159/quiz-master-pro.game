import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Zap, Users, Trophy, Coins } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("Science");
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");

  const categories = ["Science", "History", "Sports", "Entertainment", "Geography"];
  const difficulties = ["easy", "medium", "hard", "expert"];

  const handlePlayQuiz = () => {
    if (isAuthenticated) {
      navigate(`/quiz?category=${selectedCategory}&difficulty=${selectedDifficulty}`);
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const handleViewLeaderboard = () => {
    navigate("/leaderboard");
  };

  const handleViewCharacters = () => {
    navigate("/characters");
  };

  const handleViewProfile = () => {
    if (isAuthenticated) {
      navigate("/profile");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden scan-lines">
      {/* Background grid effect */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 to-pink-500" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500 bg-black/80 backdrop-blur">
        <div className="container py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400 neon-glow-cyan" />
            <h1 className="text-3xl font-bold neon-glow-cyan">QUIZ MASTER PRO</h1>
          </div>
          <nav className="flex gap-4 items-center">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 bg-black/50 px-4 py-2 border border-cyan-500 rounded">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="font-bold text-yellow-400">{user?.coins || 0}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/50 px-4 py-2 border border-pink-500 rounded">
                  <Trophy className="w-5 h-5 text-pink-400" />
                  <span className="font-bold text-pink-400">Lvl {user?.level || 1}</span>
                </div>
                <Button
                  onClick={handleViewProfile}
                  className="btn-neon-pink text-sm"
                >
                  {user?.name || "Profile"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="btn-neon text-sm"
              >
                LOGIN
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold neon-glow mb-4">ENTER THE ARENA</h2>
            <p className="text-xl text-cyan-300 neon-glow-cyan">
              Test your knowledge, earn coins, and dominate the leaderboard
            </p>
          </div>

          {/* Quiz Selection Panel */}
          <div className="max-w-2xl mx-auto bg-black/50 border-2 border-cyan-500 p-8 rounded-lg hud-border">
            <div className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-cyan-400 font-bold mb-3 neon-glow-cyan">
                  SELECT CATEGORY
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`py-2 px-3 font-bold uppercase text-sm transition-all ${
                        selectedCategory === cat
                          ? "bg-cyan-500 text-black border-2 border-cyan-300 neon-glow-cyan"
                          : "bg-black border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div>
                <label className="block text-pink-400 font-bold mb-3 neon-glow">
                  SELECT DIFFICULTY
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {difficulties.map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`py-2 px-3 font-bold uppercase text-sm transition-all ${
                        selectedDifficulty === diff
                          ? "bg-pink-500 text-black border-2 border-pink-300 neon-glow"
                          : "bg-black border-2 border-pink-500 text-pink-400 hover:bg-pink-500/20"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Play Button */}
              <button
                onClick={handlePlayQuiz}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-pink-500 text-black font-bold text-lg uppercase tracking-wider hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                START QUIZ
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* Leaderboard Card */}
          <div className="bg-black/50 border-2 border-cyan-500 p-6 rounded hud-border cursor-pointer hover:shadow-lg transition-all" onClick={handleViewLeaderboard}>
            <Trophy className="w-12 h-12 text-cyan-400 mb-4 neon-glow-cyan" />
            <h3 className="text-2xl font-bold neon-glow-cyan mb-2">LEADERBOARD</h3>
            <p className="text-cyan-300 mb-4">View top players and rankings</p>
            <Button className="btn-neon w-full">VIEW RANKINGS</Button>
          </div>

          {/* Characters Card */}
          <div className="bg-black/50 border-2 border-pink-500 p-6 rounded hud-border-pink cursor-pointer hover:shadow-lg transition-all" onClick={handleViewCharacters}>
            <Users className="w-12 h-12 text-pink-400 mb-4 neon-glow" />
            <h3 className="text-2xl font-bold neon-glow mb-2">CHARACTERS</h3>
            <p className="text-pink-300 mb-4">Unlock unique avatars with coins</p>
            <Button className="btn-neon-pink w-full">BROWSE STORE</Button>
          </div>

          {/* Stats Card */}
          {isAuthenticated && (
            <div className="bg-black/50 border-2 border-purple-500 p-6 rounded cursor-pointer hover:shadow-lg transition-all" style={{ borderColor: 'hsl(270, 100%, 50%)', boxShadow: '0 0 10px rgba(128, 0, 255, 0.3)' }}>
              <Zap className="w-12 h-12 text-purple-400 mb-4" style={{ textShadow: '0 0 10px hsl(270, 100%, 50%)' }} />
              <h3 className="text-2xl font-bold mb-2" style={{ textShadow: '0 0 10px hsl(270, 100%, 50%)' }}>YOUR STATS</h3>
              <div className="space-y-2 text-purple-300 mb-4">
                <p>Level: <span className="font-bold">{user?.level || 1}</span></p>
                <p>Total Score: <span className="font-bold">{user?.totalScore || 0}</span></p>
                <p>Games Played: <span className="font-bold">{user?.gamesPlayed || 0}</span></p>
              </div>
              <Button className="btn-neon-pink w-full" onClick={handleViewProfile}>VIEW PROFILE</Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyan-500 bg-black/80 mt-16 py-6 text-center text-cyan-400 text-sm">
        <p>© 2026 Quiz Master Pro | Powered by Neon Technology</p>
      </footer>
    </div>
  );
}
