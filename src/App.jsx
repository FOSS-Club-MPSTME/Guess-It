import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LogoGuesser from "./pages/LogoGuesser";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/logo-guesser" element={<LogoGuesser />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;