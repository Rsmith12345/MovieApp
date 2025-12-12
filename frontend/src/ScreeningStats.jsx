import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

//helper to format date
function formatDateTime(dt) {
  if (!dt) return "";
  // Convert ISO string or SQL datetime to JS Date
  const date = new Date(dt);
  if (!isNaN(date)) {
    return date.toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  // fallback if Date parsing fails
  return dt.replace("T", " ").slice(0, 16);
}


// Styled UI components
const Card = ({ children, className }) => (
  <div style={{
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "16px",
    backgroundColor: "#fefefe",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    marginBottom: "20px",
    ...className
  }}>
    {children}
  </div>
);

const CardContent = ({ children, className }) => (
  <div style={{ display: "grid", gap: "16px", ...className }}>{children}</div>
);

const Button = ({ children, onClick, style }) => (
  <button
    onClick={onClick}
    style={{
      backgroundColor: "#1d4ed8",
      color: "#fff",
      padding: "10px 16px",
      borderRadius: "6px",
      fontWeight: "bold",
      cursor: "pointer",
      border: "none",
      transition: "background-color 0.2s",
      ...style
    }}
    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#1d4ed8"}
  >
    {children}
  </button>
);

export default function ScreeningStats() {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    movieName: "",
    minSeats: "",
  });

  const [screenings, setScreenings] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const fetchScreenings = async (auto = false) => {
    setError("");
    const params = new URLSearchParams({
      from: filters.from || "",
      to: filters.to || "",
      movieName: filters.movieName || "",
      minSeats: filters.minSeats || "",
    });

    try {
      const res = await fetch(`http://127.0.0.1:5000/screening_stats?${params}`);
      const data = await res.json();

      if (!res.ok) {
        if (!auto) setError(data.error || "No screenings found.");
        setScreenings([]);
        setStats(null);
        return;
      }

      setScreenings(data.screenings || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error("Error fetching screenings:", err);
      setError("Backend not reachable.");
    }
  };

  useEffect(() => {
    fetchScreenings(true);
  }, []);

  return (
    <motion.div
      style={{ padding: "32px", maxWidth: "960px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "24px", textAlign: "center", color: "#1e40af" }}>
        Screening Filter & Stats
      </h1>

      {/* Filter Section */}
      <Card>
        <CardContent style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div>
            <label style={{ fontWeight: "bold", marginBottom: "6px", display: "block" }}>From</label>
            <input
              type="datetime-local"
              name="from"
              value={filters.from}
              onChange={handleChange}
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc", width: "100%" }}
            />
          </div>

          <div>
            <label style={{ fontWeight: "bold", marginBottom: "6px", display: "block" }}>To</label>
            <input
              type="datetime-local"
              name="to"
              value={filters.to}
              onChange={handleChange}
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc", width: "100%" }}
            />
          </div>

          <div>
            <label style={{ fontWeight: "bold", marginBottom: "6px", display: "block" }}>Movie Name</label>
            <input
              type="text"
              name="movieName"
              value={filters.movieName}
              onChange={handleChange}
              placeholder="e.g. Inception"
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc", width: "100%" }}
            />
          </div>

          <div>
            <label style={{ fontWeight: "bold", marginBottom: "6px", display: "block" }}>Min Seats</label>
            <input
              type="number"
              name="minSeats"
              value={filters.minSeats}
              onChange={handleChange}
              placeholder="e.g. 50"
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc", width: "100%" }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <Button onClick={() => fetchScreenings(false)} style={{ width: "100%" }}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p style={{ textAlign: "center", color: "red", fontWeight: "bold", marginBottom: "16px" }}>{error}</p>}

      {/* Stats Section */}
      {stats && (
        <Card>
          <CardContent style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", textAlign: "center" }}>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Avg Seats</p>
              <p style={{ fontSize: "18px", fontWeight: "bold" }}>{stats.avgSeats}</p>
            </div>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Total Screenings</p>
              <p style={{ fontSize: "18px", fontWeight: "bold" }}>{stats.totalCount}</p>
            </div>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Avg Duration (min)</p>
              <p style={{ fontSize: "18px", fontWeight: "bold" }}>{stats.avgDuration}</p>
            </div>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Top Genre</p>
              <p style={{ fontSize: "18px", fontWeight: "bold" }}>{stats.prevalentGenre}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "24px", fontSize: "16px" }}>
        <thead>
          <tr style={{ backgroundColor: "#e5e7eb" }}>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Movie</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>3D</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Seats</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Date & Time</th>
            <th style={{ padding: "10px", border: "1px solid #ccc" }}>Genre</th>
          </tr>
        </thead>
        <tbody>
          {screenings.length > 0 ? (
            screenings.map((s) => (
              <tr key={s.ScreeningID} style={{ border: "1px solid #ccc", textAlign: "center" }}>
                <td style={{ padding: "10px" }}>{s.Title}</td>
                <td style={{ padding: "10px" }}>{s.Is3D ? "Yes" : "No"}</td>
                <td style={{ padding: "10px" }}>{s.AvailableSeats}</td>
                <td style={{ padding: "10px" }}>{formatDateTime(s.ScreeningDateTime)}</td>
                <td style={{ padding: "10px" }}>{s.Genre}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ padding: "12px", textAlign: "center", color: "#9ca3af" }}>
                No screenings found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </motion.div>
  );
}
