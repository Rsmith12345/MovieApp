import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import ScreeningsApp from "./ScreeningsApp";
import ScreeningStats from "./ScreeningStats";

function NavBar() {
  const location = useLocation();

  return (
    <>
      <div className="navbar">
        <button
          className={`nav-button ${location.pathname === "/" ? "active" : "inactive"}`}
          onClick={() => (window.location.href = "/")}
        >
          Manage Screenings
        </button>
        <button
          className={`nav-button ${location.pathname === "/stats" ? "active" : "inactive"}`}
          onClick={() => (window.location.href = "/stats")}
        >
          Filter & Stats
        </button>
      </div>

      <style>{`
        .navbar {
          display: flex;
          justify-content: center;
          gap: 1rem;
          padding: 1rem;
          background-color: #f3f3f3;
        }
        .nav-button {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 600;
          color: white;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .nav-button.active {
          background-color: #1d4ed8; /* dark blue */
        }
        .nav-button.inactive {
          background-color: #3b82f6; /* lighter blue */
        }
        .nav-button.inactive:hover {
          background-color: #2563eb;
        }
      `}</style>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<ScreeningsApp />} />
        <Route path="/stats" element={<ScreeningStats />} />
      </Routes>
    </Router>
  );
}