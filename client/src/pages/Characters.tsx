import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Coins, Lock, Check } from "lucide-react";

interface Character {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  unlockCost: number;
  isDefault: boolean;
}

export default function Characters() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [userCharacterIds, setUserCharacterIds] = useState<number[]>([]);
  const [unlockingId, setUnlockingId] = useState<number | null>(null);

  const charactersQuery = trpc.characters.getAll.useQuery();
  const userCharactersQuery = trpc.characters.getUserCharacters.useQuery(undefined, {
    enabled: !!user,
  });
  const unlockMutation = trpc.characters.unlock.useMutation();

  useEffect(() => {
    if (charactersQuery.data) {
      setCharacters(charactersQuery.data);
    }
  }, [charactersQuery.data]);

  useEffect(() => {
    if (userCharactersQuery.data) {
      setUserCharacterIds(userCharactersQuery.data.map((uc) => uc.characterId));
    }
  }, [userCharactersQuery.data]);

  const handleUnlock = async (characterId: number) => {
    if (!user) {
      alert("Please log in first");
      return;
    }

    setUnlockingId(characterId);
    try {
      const result = await unlockMutation.mutateAsync({ characterId });
      if (result.success) {
        setUserCharacterIds([...userCharacterIds, characterId]);
        alert("Character unlocked!");
      } else {
        alert(result.message || "Failed to unlock character");
      }
    } catch (error) {
      console.error("Error unlocking character:", error);
      alert("Failed to unlock character");
    } finally {
      setUnlockingId(null);
    }
  };

  const isUnlocked = (characterId: number) => userCharacterIds.includes(characterId);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden scan-lines">
      <header className="border-b border-cyan-500 bg-black/80 backdrop-blur sticky top-0 z-10">
        <div className="container py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👾</span>
            <h1 className="text-3xl font-bold neon-glow-cyan">CHARACTER STORE</h1>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 bg-black/50 px-4 py-2 border border-yellow-500 rounded">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-yellow-400">{user?.coins || 0}</span>
            </div>
            <Button onClick={() => navigate("/")} className="btn-neon text-sm">
              BACK HOME
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold neon-glow-cyan mb-2">UNLOCK UNIQUE AVATARS</h2>
          <p className="text-cyan-300">Earn coins by playing quizzes and unlock new characters to customize your profile</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => {
            const unlocked = isUnlocked(character.id);

            return (
              <div
                key={character.id}
                className={`bg-black/50 border-2 rounded overflow-hidden transition-all hover:shadow-lg ${
                  unlocked ? "border-green-500 hud-border" : "border-cyan-500 hud-border"
                }`}
              >
                <div className="w-full h-48 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center text-6xl">
                  {character.imageUrl ? (
                    <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>👤</span>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold neon-glow-cyan mb-2">{character.name}</h3>
                  <p className="text-cyan-300 text-sm mb-4">{character.description || "A mysterious character from the neon realm"}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {unlocked ? (
                        <>
                          <Check className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-bold">UNLOCKED</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 text-yellow-400" />
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-bold">{character.unlockCost}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {unlocked ? (
                    <Button className="btn-neon w-full" disabled>
                      OWNED
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUnlock(character.id)}
                      disabled={!user || unlockingId === character.id}
                      className="btn-neon-pink w-full"
                    >
                      {unlockingId === character.id ? "UNLOCKING..." : "UNLOCK"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
