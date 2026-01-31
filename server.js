const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000;

// Connect to SQLite database
const db = new sqlite3.Database('comments.db');

// Create comments table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create leaderboard table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    score INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Middleware
app.use(express.json());
app.use(express.static('.'));

// API Routes
app.get('/api/comments', (req, res) => {
  db.all('SELECT * FROM comments ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Failed to fetch comments' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/comments', (req, res) => {
  const { nickname, message } = req.body;
  if (!nickname || !message) {
    return res.status(400).json({ error: 'Nickname and message are required' });
  }
  db.run('INSERT INTO comments (nickname, message) VALUES (?, ?)', [nickname, message], function(err) {
    if (err) {
      res.status(500).json({ error: 'Failed to add comment' });
    } else {
      res.json({ id: this.lastID });
    }
  });
});

// Leaderboard API
app.get('/api/leaderboard', (req, res) => {
  db.all('SELECT nickname, score, timestamp FROM leaderboard ORDER BY score DESC LIMIT 10', (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/leaderboard', (req, res) => {
  const { nickname, score } = req.body;
  if (!nickname || score === undefined || score < 0) {
    return res.status(400).json({ error: 'Nickname and valid score are required' });
  }
  db.run('INSERT INTO leaderboard (nickname, score) VALUES (?, ?)', [nickname, score], function(err) {
    if (err) {
      res.status(500).json({ error: 'Failed to save score' });
    } else {
      res.json({ id: this.lastID });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});