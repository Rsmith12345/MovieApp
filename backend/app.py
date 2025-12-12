from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import re

app = Flask(__name__)
CORS(app)

DB_PATH = "cinema.db"

#ISOLATION
#Sql lite has transation modes instead of normal isolation levels
# still control locking behvarioal, so very similar

# Using default DEFERRED isolation level (locks acquired only when needed)
# Safe for single-user app. if multi-user writes were expected, could use IMMEDIATE (gets write locks at start of transaction)
# to get a write lock at the start and protect consistnecy (if that was the priority)

# set isolation_level="IMMEDIATE" in connection


#TRANSACTIONS
# all reads and writes are wihtin a transaction in sqllite
#they are implictly began when the query writes in a .execute() statement
#any error that raises an exception in within the transaction leads to implicit rollback
#otherwise, .commit() commits (ends) the transaction write
#so, BEGIN, COMMIT/ROLLBACK, all happens behind the scenes

#autocommit is turned off by default in python's sqllite3 library (but not in the sql lite C library itself it seems)


#added for extra sanitization
def sanitize_string(s, max_len=100):
    if not s:
        return ""
    s = s.strip()                  # remove leading/trailing spaces
    s = re.sub(r"[^\w\s\-.,!?]", "", s)  # remove any special chars except common punctuation
    return s[:max_len]             # truncate if too long



# Utility: run SELECT query
def query_db(query, args=(), one=False):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute(query, args)
        rows = cur.fetchall()
        return (rows[0] if rows else None) if one else [dict(row) for row in rows]

# Utility: run INSERT/UPDATE/DELETE query
def execute_db(query, args=()):
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute(query, args)
        conn.commit()
        return cur.lastrowid

# -------------------- MOVIES --------------------
@app.route("/movies", methods=["GET"])
def get_movies():
    movies = query_db("SELECT * FROM Movie")
    return jsonify(movies)

# -------------------- SCREENINGS --------------------
@app.route("/screenings", methods=["GET"])
def get_screenings():
    screenings = query_db("SELECT * FROM Screenings")
    return jsonify(screenings)

@app.route("/screenings", methods=["POST"])
def add_screening():
    data = request.json
    execute_db(
        "INSERT INTO Screenings (MovieID, Is3D, AvailableSeats, ScreeningDateTime) VALUES (?, ?, ?, ?)",
        (data["MovieID"], int(data["Is3D"]), data["AvailableSeats"], data["ScreeningDateTime"]),
    )
    return jsonify({"message": "Screening added"}), 201

@app.route("/screenings/<int:id>", methods=["PUT"])
def update_screening(id):
    data = request.json
    execute_db(
        """UPDATE Screenings
           SET MovieID = ?, Is3D = ?, AvailableSeats = ?, ScreeningDateTime = ?
           WHERE ScreeningID = ?""",
        (data["MovieID"], int(data["Is3D"]), data["AvailableSeats"], data["ScreeningDateTime"], id),
    )
    return jsonify({"message": "Screening updated"})

@app.route("/screenings/<int:id>", methods=["DELETE"])
def delete_screening(id):
    execute_db("DELETE FROM Screenings WHERE ScreeningID = ?", (id,))
    return jsonify({"message": "Screening deleted"})

# new filtering and screening stats routes
@app.route("/screening_stats")
def screening_stats():
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    #movie_name = request.args.get("movieName")
    movie_name = sanitize_string(request.args.get("movieName")) # new line sanitized
    min_seats = request.args.get("minSeats")

    # Base query for filtered screenings
    base_query = """
    FROM Screenings s
    JOIN Movie m ON s.MovieID = m.MovieID
    WHERE 1=1
    """
    params = []
    if from_date:
        base_query += " AND s.ScreeningDateTime >= ?"
        params.append(from_date)
    if to_date:
        base_query += " AND s.ScreeningDateTime <= ?"
        params.append(to_date)
    if movie_name:
        base_query += " AND LOWER(m.Title) LIKE ?"
        params.append(f"%{movie_name.lower()}%")
    if min_seats:
        base_query += " AND s.AvailableSeats >= ?"
        params.append(min_seats)

    # 1️ Get filtered screenings
    screenings_query = f"""
    SELECT s.ScreeningID, s.AvailableSeats, s.ScreeningDateTime, s.Is3D,
           m.Title, m.Genre, m.Duration
    {base_query}
    ORDER BY s.ScreeningDateTime
    """
    screenings = query_db(screenings_query, params)

    if not screenings:
        return jsonify({"error": "No screenings found"}), 404

    # 2️ Compute stats via SQL aggregates
    stats_query = f"""
    SELECT
        COUNT(*) AS totalCount,
        ROUND(AVG(s.AvailableSeats), 1) AS avgSeats,
        ROUND(AVG(m.Duration), 1) AS avgDuration
    {base_query}
    """
    stats = query_db(stats_query, params, one=True)

    # 3️ Get most frequent genre
    genre_query = f"""
    SELECT m.Genre, COUNT(*) AS cnt
    {base_query}
    GROUP BY m.Genre
    ORDER BY cnt DESC
    LIMIT 1
    """
    top_genre_row = query_db(genre_query, params, one=True)
    prevalent_genre = top_genre_row["Genre"] if top_genre_row else "N/A"

    # 4️ Return combined result
    return jsonify({
        "screenings": screenings,
        "stats": {
            "totalCount": stats["totalCount"],
            "avgSeats": stats["avgSeats"],
            "avgDuration": stats["avgDuration"],
            "prevalentGenre": prevalent_genre
        }
    })

if __name__ == "__main__":
    app.run(debug=True)