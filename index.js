const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.json());

const ALL_POSSIBLE_TIMES = [
  { id: '1', time: '08:00 AM' },
  { id: '2', time: '10:00 AM' },
  { id: '3', time: '11:00 AM' },
  { id: '4', time: '02:00 PM' },
  { id: '5', time: '03:00 PM' },
  { id: '6', time: '04:00 PM' },
  { id: '7', time: '05:00 PM' },
];

const db = new sqlite3.Database('./bookings.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('✅ Connected to the bookings SQLite database.');
});

// --- UPDATED: Create Table on Startup with user_id ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,       
    service TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL
  )`, (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('✅ "bookings" table is ready with user_id.');
  });
});

// --- ALL API ROUTES ---

app.get('/', (req, res) => { /* ... */ });

// --- UPDATED: Route to view all bookings (includes user_id) ---
app.get('/bookings', (req, res) => {
  const sql = "SELECT * FROM bookings ORDER BY date, time";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/availability', (req, res) => { /* ... */ });

// --- UPDATED: Route to create a new booking (now expects user_id) ---
app.post('/book', (req, res) => {
  const { service, date, time, user_id } = req.body; // Destructure user_id here
  if (!service || !date || !time || !user_id) { // Added user_id to validation
    return res.status(400).json({ error: 'Missing data. Please provide service, date, time, and user_id.'});
  }

  const sql = `INSERT INTO bookings (service, date, time, user_id) VALUES (?, ?, ?, ?)`; // Added user_id to insert
  const params = [service, date, time, user_id]; // Added user_id to params

  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`✅ Booking saved with ID: ${this.lastID} for user ${user_id}`); // Log user_id
    res.status(201).json({ message: 'Booking received and saved successfully!', bookingId: this.lastID });
  });
});

app.listen(port, () => {
  console.log(`✅ Backend server is running at http://localhost:${port}`);
});