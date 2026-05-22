import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Coins, Trophy, Zap } from "lucide-react";

interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

export default function Quiz() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { emit, on, off } = useSocket();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const category = params.get("category") || "Science";
  const difficulty = params.get("difficulty") || "medium";

  const getQuestionsQuery = trpc.quiz.getQuestions.useQuery(
    { category, difficulty, limit: 10 },
    { enabled: !!category && !!difficulty }
  );

  const submitAnswerMutation = trpc.quiz.submitAnswer.useMutation();

  // Load questions
  useEffect(() => {
    if (getQuestionsQuery.data) {
      setQuestions(getQuestionsQuery.data);
      setIsLoading(false);
    }
  }, [getQuestionsQuery.data]);

  // Timer countdown
  useEffect(() => {
    if (!answered && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !answered) {
      handleAnswerSubmit(null);
    }
  }, [timeLeft, answered]);

  const currentQuestion = questions[currentQuestionIndex];
  const options = currentQuestion
    ? [
        { label: "A", value: currentQuestion.optionA },
        { label: "B", value: currentQuestion.optionB },
        { label: "C", value: currentQuestion.optionC },
        { label: "D", value: currentQuestion.optionD },
      ]
    : [];

  const handleAnswerSubmit = async (answer: string | null) => {
    if (!currentQuestion) return;

    const isCorrect = answer === currentQuestion.correctAnswer;
    const coinsReward = isCorrect ? (difficulty === "easy" ? 10 : difficulty === "medium" ? 25 : difficulty === "hard" ? 50 : 100) : 0;
    const xpReward = isCorrect ? (difficulty === "easy" ? 50 : difficulty === "medium" ? 100 : difficulty === "hard" ? 200 : 500) : 0;

    setAnswered(true);
    setSelectedAnswer(answer);

    if (isCorrect) {
      setScore(score + 1);
      setCoinsEarned(coinsEarned + coinsReward);
      setXpEarned(xpEarned + xpReward);
    }

    // Submit to backend
    await submitAnswerMutation.mutateAsync({
      questionId: currentQuestion.id,
      selectedAnswer: answer || "",
      isCorrect,
      coinsEarned: coinsReward,
      xpEarned: xpReward,
      score: isCorrect ? 1 : 0,
    });

    // Move to next question after delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTimeLeft(30);
        setAnswered(false);
        setSelectedAnswer(null);
      } else {
        setShowResults(true);
      }
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center scan-lines">
        <div className="text-center">
          <Zap className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-spin" />
          <p className="text-2xl neon-glow-cyan">LOADING QUESTIONS...</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center scan-lines">
        <div className="max-w-2xl w-full mx-4 bg-black/50 border-2 border-cyan-500 p-12 rounded hud-border text-center">
          <h2 className="text-4xl font-bold neon-glow-cyan mb-8">QUIZ COMPLETE!</h2>
          <div className="space-y-6 mb-8">
            <div className="bg-black/50 border border-cyan-500 p-4 rounded">
              <p className="text-cyan-400 text-sm mb-2">SCORE</p>
              <p className="text-4xl font-bold neon-glow-cyan">{score}/{questions.length}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/50 border border-yellow-500 p-4 rounded">
                <Coins className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-yellow-400 text-sm mb-2">COINS EARNED</p>
                <p className="text-2xl font-bold text-yellow-400">+{coinsEarned}</p>
              </div>
              <div className="bg-black/50 border border-purple-500 p-4 rounded">
                <Zap className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-purple-400 text-sm mb-2">XP EARNED</p>
                <p className="text-2xl font-bold text-purple-400">+{xpEarned}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/")}
              className="btn-neon flex-1"
            >
              HOME
            </Button>
            <Button
              onClick={() => navigate("/leaderboard")}
              className="btn-neon-pink flex-1"
            >
              LEADERBOARD
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-2xl neon-glow">NO QUESTIONS AVAILABLE</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden scan-lines">
      {/* Header HUD */}
      <div className="border-b border-cyan-500 bg-black/80 backdrop-blur sticky top-0 z-10">
        <div className="container py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-black/50 px-4 py-2 border border-cyan-500 rounded">
              <span className="text-cyan-400 text-sm">QUESTION</span>
              <span className="text-cyan-300 font-bold">{currentQuestionIndex + 1}/{questions.length}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/50 px-4 py-2 border border-pink-500 rounded">
              <Trophy className="w-5 h-5 text-pink-400" />
              <span className="text-pink-400 font-bold">{score} CORRECT</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-black/50 px-4 py-2 border border-yellow-500 rounded">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold">+{coinsEarned}</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 border-2 rounded font-bold text-lg ${timeLeft > 10 ? 'border-cyan-500 text-cyan-400' : 'border-red-500 text-red-400 animate-pulse'}`}>
              <Zap className="w-5 h-5" />
              <span>{timeLeft}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-3xl mx-auto">
          {/* Question Card */}
          <div className="bg-black/50 border-2 border-cyan-500 p-8 rounded mb-8 hud-border">
            <h2 className="text-2xl font-bold neon-glow-cyan mb-8">{currentQuestion.question}</h2>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((option) => {
                const isSelected = selectedAnswer === option.value;
                const isCorrect = option.value === currentQuestion.correctAnswer;
                const showCorrect = answered && isCorrect;
                const showIncorrect = answered && isSelected && !isCorrect;

                return (
                  <button
                    key={option.label}
                    onClick={() => !answered && handleAnswerSubmit(option.value)}
                    disabled={answered}
                    className={`p-4 text-left font-bold uppercase tracking-wider transition-all ${
                      showCorrect
                        ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                        : showIncorrect
                        ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                        : isSelected
                        ? "bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400"
                        : "bg-black/50 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                    } ${answered ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className="font-bold text-lg mr-3">{option.label}.</span>
                    {option.value}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-black/50 border border-cyan-500 p-4 rounded">
            <div className="w-full bg-black/50 rounded h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-pink-500 h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
