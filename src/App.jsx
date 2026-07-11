import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LogoGuesser from "./pages/LogoGuesser";
import FlagGuesser from "./pages/FlagGuesser";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/logo-guesser" element={<LogoGuesser />} />
        <Route path="/flag-guesser" element={<FlagGuesser />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;