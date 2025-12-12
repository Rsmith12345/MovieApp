import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./ScreeningsApp.css";

const Card = ({ children, className }) => <div className={`card ${className}`}>{children}</div>;
const CardContent = ({ children, className }) => <div className={`card-content ${className}`}>{children}</div>;
const Button = ({ children, onClick, className }) => (
  <button onClick={onClick} className={`button ${className}`}>
    {children}
  </button>
);


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

export default function ScreeningsApp() {
  const [movies, setMovies] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [newScreening, setNewScreening] = useState({
    MovieID: "",
    Is3D: false,
    AvailableSeats: "",
    ScreeningDateTime: "",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/movies")
      .then((res) => res.json())
      .then(setMovies);
    fetch("http://127.0.0.1:5000/screenings")
      .then((res) => res.json())
      .then(setScreenings);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewScreening((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
  // Validation
  if (!newScreening.MovieID) {
    alert("Please select a movie.");
    return;
  }
  if (!newScreening.AvailableSeats || newScreening.AvailableSeats <= 0) {
    alert("Please enter a valid number of available seats.");
    return;
  }
  if (!newScreening.ScreeningDateTime) {
    alert("Please select a valid date and time.");
    return;
  }

  const method = editingId ? "PUT" : "POST";
  const url = editingId
    ? `http://127.0.0.1:5000/screenings/${editingId}`
    : "http://127.0.0.1:5000/screenings";

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newScreening),
  });

  setNewScreening({ MovieID: "", Is3D: false, AvailableSeats: "", ScreeningDateTime: "" });
  setEditingId(null);
  fetch("http://127.0.0.1:5000/screenings")
    .then((res) => res.json())
    .then(setScreenings);
};

  const handleEdit = (s) => {
    setNewScreening({
      MovieID: s.MovieID,
      Is3D: !!s.Is3D,
      AvailableSeats: s.AvailableSeats,
      ScreeningDateTime: s.ScreeningDateTime,
    });
    setEditingId(s.ScreeningID);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewScreening({ MovieID: "", Is3D: false, AvailableSeats: "", ScreeningDateTime: "" });
  };

  const handleDelete = async (id) => {
    await fetch(`http://127.0.0.1:5000/screenings/${id}`, { method: "DELETE" });
    setScreenings(screenings.filter((s) => s.ScreeningID !== id));
  };

  return (
    <motion.div
      className="container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="title">Movie Screenings</h1>

      <Card className="add-edit-card">
        <CardContent className="add-edit-content">
          <h2>{editingId ? "Edit Screening" : "Add Screening"}</h2>
          <div className="form-row">
            <select
              name="MovieID"
              value={newScreening.MovieID}
              onChange={handleChange}
            >
              <option value="">Select Movie</option>
              {movies.map((m) => (
                <option key={m.MovieID} value={m.MovieID}>
                  {m.Title}
                </option>
              ))}
            </select>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="Is3D"
                checked={newScreening.Is3D}
                onChange={handleChange}
              />
              3D
            </label>

            <input
              type="number"
              name="AvailableSeats"
              placeholder="Seats"
              value={newScreening.AvailableSeats}
              onChange={handleChange}
            />

            <input
              type="datetime-local"
              name="ScreeningDateTime"
              value={newScreening.ScreeningDateTime}
              onChange={handleChange}
            />

            <Button onClick={handleSubmit}>{editingId ? "Update" : "Add"}</Button>
            {editingId && <Button onClick={handleCancelEdit} className="cancel-button">Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <table className="screenings-table">
        <thead>
          <tr>
            <th>Movie</th>
            <th>3D</th>
            <th>Seats</th>
            <th>Date & Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {screenings.map((s) => {
            const movie = movies.find((m) => m.MovieID === s.MovieID);
            return (
              <tr key={s.ScreeningID}>
                <td>{movie?.Title || "Unknown"}</td>
                <td>{s.Is3D ? "Yes" : "No"}</td>
                <td>{s.AvailableSeats}</td>
                <td>{formatDateTime(s.ScreeningDateTime)}</td>
                <td>
                  <Button onClick={() => handleEdit(s)}>Edit</Button>
                  <Button onClick={() => handleDelete(s.ScreeningID)} className="delete-button">Delete</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
}



