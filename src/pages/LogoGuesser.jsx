import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Timer, Sparkles, Trophy } from "lucide-react";
import "./LogoGuesser.css";
import { LOGO_QUESTIONS } from "../data/logoData";

const GAME_DURATION = 45; // seconds
const QUESTIONS_PER_GAME = 10;
const FEEDBACK_DELAY = 1000; // ms — how long the green/red flash stays

const POINTS_CORRECT = 3;
const POINTS_WRONG = -1;
const POINTS_SKIPPED = 0;

const LEADERBOARD_KEY = "guess-it-logo-leaderboard";
const LEADERBOARD_LIMIT = 10;

const MARQUEE_ROWS = 7;
const MARQUEE_REPEATS = 8;

function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const m = String(Math.floor(safe / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function loadLeaderboard() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLeaderboard(entries) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {
    // ignore write errors (private browsing, storage full, etc.)
  }
}

function MarqueeBackground() {
  return (
    <div className="marquee-bg" aria-hidden="true">
      {Array.from({ length: MARQUEE_ROWS }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={`marquee-row ${rowIndex % 2 === 0 ? "marquee-left" : "marquee-right"}`}
        >
          <div className="marquee-track">
            {Array.from({ length: MARQUEE_REPEATS }).map((_, i) => (
              <span className="marquee-text" key={`a-${i}`}>
                GUESS IT!
              </span>
            ))}
          </div>
          <div className="marquee-track" aria-hidden="true">
            {Array.from({ length: MARQUEE_REPEATS }).map((_, i) => (
              <span className="marquee-text" key={`b-${i}`}>
                FOSS MPSTME!
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeBackButton({ onClick }) {
  return (
    <button className="home-back-btn" onClick={onClick} aria-label="Back to home">
      <ArrowLeft size={22} strokeWidth={2.6} />
    </button>
  );
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildRound() {
  const picked = shuffle(LOGO_QUESTIONS).slice(0, QUESTIONS_PER_GAME);
  return picked.map((q) => ({ ...q, options: shuffle(q.options) }));
}

export default function LogoGuesser() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("name"); // "name" | "playing" | "finished"
  const [playerName, setPlayerName] = useState("");

  const [round, setRound] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // { status: "correct"|"wrong"|"skipped", selected }
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" (live flash only)

  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard());
  const [lastEntryId, setLastEntryId] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [finishTime, setFinishTime] = useState(0);

  const feedbackTimeoutRef = useRef(null);
  const timerRef = useRef(null);
  const hasRecordedRef = useRef(false);

  // ---------- Start ----------
  const handleStart = (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    hasRecordedRef.current = false;
    const newRound = buildRound();
    setRound(newRound);
    setAnswers(new Array(newRound.length).fill(null));
    setCurrentIndex(0);
    setTimeLeft(GAME_DURATION);
    setPhase("playing");
  };

  // ---------- Timer ----------
  useEffect(() => {
    if (phase !== "playing") return undefined;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase("finished");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => () => clearTimeout(feedbackTimeoutRef.current), []);

  const currentQuestion = round[currentIndex];
  const currentAnswer = answers[currentIndex];

  const goToIndex = useCallback((idx) => {
    clearTimeout(feedbackTimeoutRef.current);
    setSelectedOption(null);
    setFeedback(null);
    setCurrentIndex(idx);
  }, []);

  // ---------- Answering ----------
  const isAnswered = currentAnswer && currentAnswer.status !== "skipped";

  const handleOptionClick = (option) => {
    if (isAnswered || feedback) return; // already answered / mid-flash

    const isCorrect = option === currentQuestion.answer;
    setSelectedOption(option);
    setFeedback(isCorrect ? "correct" : "wrong");

    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = {
        status: isCorrect ? "correct" : "wrong",
        selected: option,
      };
      return next;
    });

    feedbackTimeoutRef.current = setTimeout(() => {
      setSelectedOption(null);
      setFeedback(null);
      if (currentIndex < round.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setPhase("finished");
      }
    }, FEEDBACK_DELAY);
  };

  // ---------- Skip / Next ----------
  const handleSkip = () => {
    if (feedback) return;

    setAnswers((prev) => {
      if (prev[currentIndex]) return prev; // already answered — just move on
      const next = [...prev];
      next[currentIndex] = { status: "skipped", selected: null };
      return next;
    });

    if (currentIndex < round.length - 1) {
      goToIndex(currentIndex + 1);
    } else {
      setPhase("finished");
    }
  };

  // ---------- Back ----------
  const handleBack = () => {
    if (feedback || currentIndex === 0) return;
    goToIndex(currentIndex - 1);
  };

  // ---------- Results ----------
  const correctCount = answers.filter((a) => a?.status === "correct").length;
  const wrongCount = answers.filter((a) => a?.status === "wrong").length;
  const skippedCount = answers.filter(
    (a) => !a || a.status === "skipped"
  ).length;

  // ---------- Leaderboard: record this run once, on finish ----------
  useEffect(() => {
    if (phase !== "finished" || hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    const elapsed = GAME_DURATION - timeLeft;
    const score =
      correctCount * POINTS_CORRECT +
      wrongCount * POINTS_WRONG +
      skippedCount * POINTS_SKIPPED;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setFinalScore(score);
    setFinishTime(elapsed);
    setLastEntryId(id);

    setLeaderboard((prev) => {
      const updated = [
        ...prev,
        { id, name: playerName.trim() || "Player", score, time: elapsed },
      ]
        // Sort by score desc; tiebreaker is whoever finished faster (lower time)
        .sort((a, b) => b.score - a.score || a.time - b.time)
        .slice(0, LEADERBOARD_LIMIT);
      saveLeaderboard(updated);
      return updated;
    });
  }, [phase, timeLeft, playerName, correctCount, wrongCount, skippedCount]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  // ================= NAME ENTRY =================
  if (phase === "name") {
    return (
      <div className="logo-guesser-page">
        <MarqueeBackground />
        <HomeBackButton onClick={() => navigate("/")} />
        <div className="name-entry-card">
          <span className="name-entry-icon">
            <Sparkles size={36} strokeWidth={2} />
          </span>
          <h1 className="name-entry-title">Guess the Logo</h1>
          <p className="name-entry-subtitle">
            Enter your name to start. You'll have 45 seconds to guess 10
            open source logos.
          </p>
          <form className="name-entry-form" onSubmit={handleStart}>
            <input
              type="text"
              className="name-entry-input"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={24}
              autoFocus
            />
            <button
              type="submit"
              className="name-entry-btn"
              disabled={!playerName.trim()}
            >
              Start Game
              <ArrowRight size={18} strokeWidth={2.2} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ================= RESULTS =================
  if (phase === "finished") {
    return (
      <div className="logo-guesser-page">
        <MarqueeBackground />
        <div className="results-wrap">
          {/* ---- Left card: score & stats ---- */}
          <div className="results-card">
            <h1 className="results-title">Time's Up!</h1>
            <p className="results-player">Nice work, {playerName}!</p>

            <div className="results-score">
              <span className="results-score-value">{finalScore}</span>
              <span className="results-score-label">points</span>
            </div>

            <div className="results-stats">
              <div className="results-stat results-stat-correct">
                <span className="results-stat-value">{correctCount}</span>
                <span className="results-stat-label">Correct</span>
              </div>
              <div className="results-stat results-stat-wrong">
                <span className="results-stat-value">{wrongCount}</span>
                <span className="results-stat-label">Wrong</span>
              </div>
              <div className="results-stat results-stat-skipped">
                <span className="results-stat-value">{skippedCount}</span>
                <span className="results-stat-label">Skipped</span>
              </div>
            </div>

            <p className="results-time">
              Finished in <strong>{formatTime(finishTime)}</strong>
            </p>

            <button className="results-btn" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>

          {/* ---- Right card: leaderboard ---- */}
          <div className="leaderboard-card">
            <h2 className="leaderboard-title">
              <Trophy size={18} strokeWidth={2.4} />
              Leaderboard
            </h2>

            <div className="leaderboard-header-row">
              <span>#</span>
              <span>Name</span>
              <span>Score</span>
              <span>Time</span>
            </div>

            <div className="leaderboard-list">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`leaderboard-row ${
                    entry.id === lastEntryId ? "is-you" : ""
                  }`}
                >
                  <span className="leaderboard-rank">#{i + 1}</span>
                  <span className="leaderboard-name">{entry.name}</span>
                  <span className="leaderboard-score">{entry.score}</span>
                  <span className="leaderboard-time">
                    {formatTime(entry.time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= PLAYING =================
  return (
    <div className="logo-guesser-page">
      <MarqueeBackground />
      <div className="game-wrap">
        <div className="game-topbar">
          <div className="game-progress">
            Question {currentIndex + 1} / {round.length}
          </div>
          <div className={`game-timer ${timeLeft <= 10 ? "game-timer-danger" : ""}`}>
            <Timer size={18} strokeWidth={2.2} />
            {minutes}:{seconds}
          </div>
        </div>

        <div className="game-progress-track">
          {round.map((_, i) => {
            const status = answers[i]?.status;
            return (
              <span
                key={i}
                className={`game-progress-dot ${i === currentIndex ? "is-current" : ""} ${
                  status ? `is-${status}` : ""
                }`}
              />
            );
          })}
        </div>

        <div className="question-photo-frame">
          <img src={currentQuestion.image} alt="Guess the logo" />
        </div>

        <div className="options-grid">
          {currentQuestion.options.map((option) => {
            const displayedSelection = feedback
              ? selectedOption
              : currentAnswer?.selected;
            const displayedStatus = feedback || currentAnswer?.status;

            let stateClass = "";
            if (displayedSelection === option && displayedStatus === "correct") {
              stateClass = "option-correct";
            } else if (displayedSelection === option && displayedStatus === "wrong") {
              stateClass = "option-wrong";
            }

            return (
              <button
                key={option}
                className={`option-btn ${stateClass}`}
                onClick={() => handleOptionClick(option)}
                disabled={!!feedback || isAnswered}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="game-nav">
          <button
            className="game-nav-btn"
            onClick={handleBack}
            disabled={currentIndex === 0 || !!feedback}
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
            Back
          </button>
          <button
            className="game-nav-btn game-nav-btn-primary"
            onClick={handleSkip}
            disabled={!!feedback}
          >
            Next
            <ArrowRight size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}