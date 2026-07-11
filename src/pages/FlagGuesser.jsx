import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Timer, Flag, Trophy } from "lucide-react";
import "./FlagGuesser.css";
import { FLAG_QUESTIONS } from "../data/flagData";

const GAME_DURATION = 45; // seconds
const QUESTIONS_PER_GAME = 10;
const FEEDBACK_DELAY = 1000; // ms — how long the green/red flash stays

const POINTS_CORRECT = 3;
const POINTS_WRONG = -1;
const POINTS_SKIPPED = 0;

const LEADERBOARD_KEY = "guess-it-flag-leaderboard";
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
    <div className="flag-marquee-bg" aria-hidden="true">
      {Array.from({ length: MARQUEE_ROWS }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={`flag-marquee-row ${rowIndex % 2 === 0 ? "flag-marquee-left" : "flag-marquee-right"}`}
        >
          <div className="flag-marquee-track">
            {Array.from({ length: MARQUEE_REPEATS }).map((_, i) => (
              <span className="flag-marquee-text" key={`a-${i}`}>
                GUESS IT!
              </span>
            ))}
          </div>
          <div className="flag-marquee-track" aria-hidden="true">
            {Array.from({ length: MARQUEE_REPEATS }).map((_, i) => (
              <span className="flag-marquee-text" key={`b-${i}`}>
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
    <button className="flag-home-back-btn" onClick={onClick} aria-label="Back to home">
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
  const picked = shuffle(FLAG_QUESTIONS).slice(0, QUESTIONS_PER_GAME);
  return picked.map((q) => ({ ...q, options: shuffle(q.options) }));
}

export default function FlagGuesser() {
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
      <div className="flag-guesser-page">
        <MarqueeBackground />
        <HomeBackButton onClick={() => navigate("/")} />
        <div className="flag-name-entry-card">
          <span className="flag-name-entry-icon">
            <Flag size={36} strokeWidth={2} />
          </span>
          <h1 className="flag-name-entry-title">Guess the Flag</h1>
          <p className="flag-name-entry-subtitle">
            Enter your name to start. You'll have 45 seconds to guess 10
            country flags.
          </p>
          <form className="flag-name-entry-form" onSubmit={handleStart}>
            <input
              type="text"
              className="flag-name-entry-input"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={24}
              autoFocus
            />
            <button
              type="submit"
              className="flag-name-entry-btn"
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
      <div className="flag-guesser-page">
        <MarqueeBackground />
        <div className="flag-results-wrap">
          {/* ---- Left card: score & stats ---- */}
          <div className="flag-results-card">
            <h1 className="flag-results-title">Time's Up!</h1>
            <p className="flag-results-player">Nice work, {playerName}!</p>

            <div className="flag-results-score">
              <span className="flag-results-score-value">{finalScore}</span>
              <span className="flag-results-score-label">points</span>
            </div>

            <div className="flag-results-stats">
              <div className="flag-results-stat flag-results-stat-correct">
                <span className="flag-results-stat-value">{correctCount}</span>
                <span className="flag-results-stat-label">Correct</span>
              </div>
              <div className="flag-results-stat flag-results-stat-wrong">
                <span className="flag-results-stat-value">{wrongCount}</span>
                <span className="flag-results-stat-label">Wrong</span>
              </div>
              <div className="flag-results-stat flag-results-stat-skipped">
                <span className="flag-results-stat-value">{skippedCount}</span>
                <span className="flag-results-stat-label">Skipped</span>
              </div>
            </div>

            <p className="flag-results-time">
              Finished in <strong>{formatTime(finishTime)}</strong>
            </p>

            <button className="flag-results-btn" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>

          {/* ---- Right card: leaderboard ---- */}
          <div className="flag-leaderboard-card">
            <h2 className="flag-leaderboard-title">
              <Trophy size={18} strokeWidth={2.4} />
              Leaderboard
            </h2>

            <div className="flag-leaderboard-header-row">
              <span>#</span>
              <span>Name</span>
              <span>Score</span>
              <span>Time</span>
            </div>

            <div className="flag-leaderboard-list">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`flag-leaderboard-row ${
                    entry.id === lastEntryId ? "is-you" : ""
                  }`}
                >
                  <span className="flag-leaderboard-rank">#{i + 1}</span>
                  <span className="flag-leaderboard-name">{entry.name}</span>
                  <span className="flag-leaderboard-score">{entry.score}</span>
                  <span className="flag-leaderboard-time">
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
    <div className="flag-guesser-page">
      <MarqueeBackground />
      <div className="flag-game-wrap">
        <div className="flag-game-topbar">
          <div className="flag-game-progress">
            Question {currentIndex + 1} / {round.length}
          </div>
          <div className={`flag-game-timer ${timeLeft <= 10 ? "flag-game-timer-danger" : ""}`}>
            <Timer size={18} strokeWidth={2.2} />
            {minutes}:{seconds}
          </div>
        </div>

        <div className="flag-game-progress-track">
          {round.map((_, i) => {
            const status = answers[i]?.status;
            return (
              <span
                key={i}
                className={`flag-game-progress-dot ${i === currentIndex ? "is-current" : ""} ${
                  status ? `is-${status}` : ""
                }`}
              />
            );
          })}
        </div>

        <div className="flag-game-row">
          <div className="flag-photo-frame">
            <img src={currentQuestion.image} alt="Guess the flag" />
          </div>

          <div className="flag-panel">
            <div className="flag-options-grid">
              {currentQuestion.options.map((option) => {
                const displayedSelection = feedback
                  ? selectedOption
                  : currentAnswer?.selected;
                const displayedStatus = feedback || currentAnswer?.status;

                let stateClass = "";
                if (displayedSelection === option && displayedStatus === "correct") {
                  stateClass = "flag-option-correct";
                } else if (displayedSelection === option && displayedStatus === "wrong") {
                  stateClass = "flag-option-wrong";
                }

                return (
                  <button
                    key={option}
                    className={`flag-option-btn ${stateClass}`}
                    onClick={() => handleOptionClick(option)}
                    disabled={!!feedback || isAnswered}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="flag-game-nav">
              <button
                className="flag-game-nav-btn"
                onClick={handleBack}
                disabled={currentIndex === 0 || !!feedback}
              >
                <ArrowLeft size={18} strokeWidth={2.2} />
                Back
              </button>
              <button
                className="flag-game-nav-btn flag-game-nav-btn-primary"
                onClick={handleSkip}
                disabled={!!feedback}
              >
                Next
                <ArrowRight size={18} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}