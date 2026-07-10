import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Timer, Sparkles } from "lucide-react";
import "./LogoGuesser.css";
import { LOGO_QUESTIONS } from "../data/logoData";

const GAME_DURATION = 120; // seconds
const QUESTIONS_PER_GAME = 10;
const FEEDBACK_DELAY = 1000; // ms — how long the green/red flash stays

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

  const feedbackTimeoutRef = useRef(null);
  const timerRef = useRef(null);

  // ---------- Start ----------
  const handleStart = (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
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
  const handleOptionClick = (option) => {
    if (currentAnswer || feedback) return; // already answered / mid-flash

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

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  // ================= NAME ENTRY =================
  if (phase === "name") {
    return (
      <div className="logo-guesser-page">
        <div className="name-entry-card">
          <span className="name-entry-icon">
            <Sparkles size={36} strokeWidth={2} />
          </span>
          <h1 className="name-entry-title">Guess the Logo</h1>
          <p className="name-entry-subtitle">
            Enter your name to start. You'll have 120 seconds to guess 10
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
        <div className="results-card">
          <h1 className="results-title">Time's Up!</h1>
          <p className="results-player">Nice work, {playerName}!</p>

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

          <button className="results-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ================= PLAYING =================
  return (
    <div className="logo-guesser-page">
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
                disabled={!!feedback || !!currentAnswer}
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