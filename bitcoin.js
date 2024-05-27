const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();
const helmet = require('helmet');

// Sicherheitsheader setzen
app.use(helmet());
app.use(express.json());

const db = new sqlite3.Database('./users.db');

// Middleware zur Überprüfung des JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Benutzerregistrierung
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
    if (err) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(201).json({ message: 'User registered' });
  });
});

// Benutzerlogin
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.sendStatus(500);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' });
    res.json({ accessToken });
  });
});

// Ratenlimit-Middleware
const rateLimit = (req, res, next) => {
  const username = req.user.username;

  db.get('SELECT api_requests FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.sendStatus(500);
    if (user.api_requests >= 100) {
      return res.status(429).json({ error: 'Monthly request limit reached' });
    }

    db.run('UPDATE users SET api_requests = api_requests + 1 WHERE username = ?', [username], (err) => {
      if (err) return res.sendStatus(500);
      next();
    });
  });
};

// Statische Dateien (HTML, CSS, JS) bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// JSON-Daten einmal lesen
let jsonData = null;
const dataPath = path.join(__dirname, 'public', 'cryptocurrency-metadata.json');

fs.readFile(dataPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Fehler beim Lesen der JSON-Datei:', err);
    process.exit(1);
  }
  try {
    jsonData = JSON.parse(data);
    console.log('JSON-Daten erfolgreich gelesen');
  } catch (err) {
    console.error('Fehler beim Parsen der JSON-Daten:', err);
    process.exit(1);
  }
});

// Routen
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/metajson', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'metajson.json'));
});

app.get('/api/documentation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'doc.html'));
});

app.get('/api/cryptocurrency/listings/latest', authenticateToken, rateLimit, async (req, res) => {
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.CMC_PRO_API_KEY,
      },
    });
    res.json(response.data);
  } catch (ex) {
    console.error(ex);
    res.status(500).send('Error fetching data');
  }
});

app.get('/api/cryptocurrency/listings', authenticateToken, rateLimit, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coin-list.json'));
});

app.get('/api/cryptocurrency/tags/:tagName', authenticateToken, rateLimit, async (req, res) => {
  const tagName = req.params.tagName.toLowerCase();
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.CMC_PRO_API_KEY,
      },
    });

    const filteredCoins = response.data.data.filter(coin => 
      coin.tags && coin.tags.map(tag => tag.toLowerCase()).includes(tagName)
    );

    if (filteredCoins.length > 0) {
      res.json(filteredCoins);
    } else {
      res.status(404).json({
        "status_code": "404",
        "status_msg": "Coins not Found with tag",
        "time_stamp": Date.now(),
        "request": `Error occurred with tag: {${tagName}}`
      });
    }
  } catch (ex) {
    console.error(ex);
    res.status(500).send('Error fetching data');
  }
});

app.get('/api/cryptocurrency/tags', authenticateToken, rateLimit, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tag-list.json'));
});

// Dashboard für den Benutzer
app.get('/dashboard', authenticateToken, (req, res) => {
  const username = req.user.username;

  db.get('SELECT api_requests FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.sendStatus(500);
    res.json({
      username: username,
      api_requests: user.api_requests,
      remaining_requests: 100 - user.api_requests,
    });
  });
});

// Fallback für alle anderen ungültigen Endpunkte
app.use((req, res, next) => {
  res.status(404).json({
    "status_code": "404",
    "status_msg": "path_not_found",
    "time_stamp": Date.now(),
    "request": `Error occurred with path: ${req.originalUrl}`
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
