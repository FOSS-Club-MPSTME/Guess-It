import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";

// Placeholder imports — build these pages next
// import LogoGuesser from "./pages/LogoGuesser";
// import FlagGuesser from "./pages/FlagGuesser";
// import ClubGuesser from "./pages/ClubGuesser";
// import UiGuesser from "./pages/UiGuesser";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Wire these up as each page gets built */}
        {/* <Route path="/logo-guesser" element={<LogoGuesser />} /> */}
        {/* <Route path="/flag-guesser" element={<FlagGuesser />} /> */}
        {/* <Route path="/club-guesser" element={<ClubGuesser />} /> */}
        {/* <Route path="/ui-guesser" element={<UiGuesser />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;