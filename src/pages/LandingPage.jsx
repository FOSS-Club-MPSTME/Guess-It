import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import "./LandingPage.css";

import logoGuesserImg from "/photos/logo-guesser.png";
import flagGuesserImg from "/photos/flag-guesser.png";
import clubGuesserImg from "/photos/club-guesser.png";
import uiGuesserImg from "/photos/ui-guesser.png";

const GAMES = [
  {
    name: "Guess the Logo",
    tagline: "Open source apps",
    image: logoGuesserImg,
    path: "/logo-guesser",
  },
  {
    name: "Guess the Country",
    tagline: "Countries of the world",
    image: flagGuesserImg,
    path: "/flag-guesser",
  },
  {
    name: "Guess the Football Club",
    tagline: "Football crests",
    image: clubGuesserImg,
    path: "/club-guesser",
  },
  {
    name: "Guess the App",
    tagline: "Social media apps",
    image: uiGuesserImg,
    path: "/ui-guesser",
  },
];

function GameCard({ game }) {
  const navigate = useNavigate();

  return (
    <div className="game-card">
      <div className="game-card-photo">
        <img src={game.image} alt={`${game.name} preview`} />
      </div>

      <div className="game-card-info">
        <h3 className="game-card-name">{game.name}</h3>
        <p className="game-card-tagline">{game.tagline}</p>
      </div>

      <button className="game-card-btn" onClick={() => navigate(game.path)}>
        Enter Game
        <ArrowRight size={16} strokeWidth={2.2} />
      </button>
    </div>
  );
}

const MARQUEE_ROWS = 7;
const MARQUEE_REPEATS = 8;

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

export default function LandingPage() {
  return (
    <div className="landing-page">
      <MarqueeBackground />

      <header className="landing-header">
        <span className="landing-logo-wrap">
          <Sparkles size={44} strokeWidth={2} className="landing-logo-icon" />
        </span>
        <h1 className="landing-title">GUESS IT!</h1>
      </header>

      <main className="card-row">
        {GAMES.map((game) => (
          <GameCard key={game.name} game={game} />
        ))}
      </main>
    </div>
  );
}