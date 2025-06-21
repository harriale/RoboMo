const express = require('express');
const { Client } = require('pg'); // Import the PostgreSQL client
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// --- PostgreSQL Database Setup ---
const client = new Client({
  connectionString: 'postgresql://postgres:SZandErs1976#+#@db.hlpxfefnjclsudjyykvx.supabase.co:5432/postgres', // YOUR FULL CONNECTION STRING HERE
  ssl: {
    rejectUnauthorized: false // Required for connecting to Supabase from Render/Vercel (accept self-signed certs)
  }
});

client.connect(err => {
  if (err) {
    console.error('❌ Failed to connect to PostgreSQL database:', err.message);
    return;
  }
  console.log('✅ Connected to PostgreSQL database.');

  // --- Create Table on Startup (PostgreSQL syntax) ---
  client.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,       
      service TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `, (err, res) => {
    if (err) {
      console.error('❌ Error creating bookings table:', err.message);
    } else {
      console.log('✅ "bookings" table is ready in PostgreSQL.');
    }
  });
});
// ---------------------------------------------------


const ALL_POSSIBLE_TIMES = [
  { id: '1', time: '08:00 AM' }, { id: '2', time: '10:00 AM' }, { id: '3', time: '11:00 AM' },
  { id: '4', time: '02:00 PM' }, { id: '5', time: '03:00 PM' }, { id: '6', time: '04:00 PM' },
  { id: '7', time: '05:00 PM' },
];

// --- ALL API ROUTES ---

app.get('/', (req, res) => {
  res.send('Hello from the Booking App Backend!');
});

// --- UPDATED: Route to view all bookings (PostgreSQL) ---
app.get('/bookings', async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM bookings ORDER BY date, time, created_at");
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching bookings:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- UPDATED: Route to get available times for a specific date (PostgreSQL) ---
app.get('/availability', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'A date query parameter is required.' });
  }

  try {
    // Get booked times for the given date from PostgreSQL
    const sql = `SELECT time FROM bookings WHERE date = $1`; // Use $1 for parameter
    const result = await client.query(sql, [date]);
    const bookedTimes = result.rows.map(row => row.time);

    console.log(`Booked times for ${date}:`, bookedTimes);

    const availableTimes = ALL_POSSIBLE_TIMES.filter(
      (slot) => !bookedTimes.includes(slot.time)
    );

    console.log(`Returning available times for ${date}:`, availableTimes);
    res.json(availableTimes);

  } catch (err) {
    console.error('❌ Error fetching availability:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- UPDATED: Route to create a new booking (PostgreSQL) ---
app.post('/book', async (req, res) => {
  const { service, date, time, user_id } = req.body;
  if (!service || !date || !time || !user_id) {
    return res.status(400).json({ error: 'Missing data. Please provide service, date, time, and user_id.'});
  }

  try {
    const sql = `INSERT INTO bookings (service, date, time, user_id) VALUES ($1, $2, $3, $4) RETURNING id`; // Use $1, $2 etc. and RETURNING id
    const params = [service, date, time, user_id];

    const result = await client.query(sql, params);
    const newBookingId = result.rows[0].id; // Get the ID of the new booking

    console.log(`✅ Booking saved with ID: ${newBookingId} for user ${user_id} in PostgreSQL`);
    res.status(201).json({ message: 'Booking received and saved successfully!', bookingId: newBookingId });

  } catch (err) {
    console.error('❌ Error saving booking:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// --- Start the server ---
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Backend server is running on port ${port} (0.0.0.0)`);
});