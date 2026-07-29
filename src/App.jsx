import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LogoGuesser from "./pages/LogoGuesser";
import FlagGuesser from "./pages/FlagGuesser";
import ClubGuesser from "./pages/ClubGuesser";
import UiGuesser from "./pages/UiGuesser";

// This File is only used for Routing between the different pages of the app. It is not used for any other purpose.

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/logo-guesser" element={<LogoGuesser />} />
        <Route path="/flag-guesser" element={<FlagGuesser />} />
        <Route path="/club-guesser" element={<ClubGuesser />} />
        <Route path="/ui-guesser" element={<UiGuesser />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;