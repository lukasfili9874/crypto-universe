const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Statische Dateien (HTML, CSS, JS) bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath);
});

app.get('/api', (req, res) => {
  const location = "/api";
  res.status(404).json({
    "status_code": "404",
    "status_msg": "path_not_found",
    "time_stamp": Date.now(),
    "request": `Error occurred with {${location}}`
  });
});

app.get('/api/documentation', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'doc.html');
  res.sendFile(indexPath);
});

// Pfad zur JSON-Datei definieren
const dataPath = path.join(__dirname, 'public', 'cryptocurrency-metadata.json');

// JSON-Daten einmal lesen
let jsonData = null;
fs.readFile(dataPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Fehler beim Lesen der JSON-Datei:', err);
    process.exit(1); // Beende den Server, wenn ein Fehler beim Lesen der Datei auftritt
  }
  try {
    jsonData = JSON.parse(data);
    console.log('JSON-Daten erfolgreich gelesen');
  } catch (err) {
    console.error('Fehler beim Parsen der JSON-Daten:', err);
    process.exit(1); // Beende den Server, wenn ein Fehler beim Parsen der JSON-Daten auftritt
  }
});

app.get("/api/cryptocurrency", (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'cryptocurrency-metadata.json');
  res.sendFile(indexPath);
});

// Routen für verschiedene Coins
app.get('/api/cryptocurrency/:coin', (req, res) => {
  const coin = req.params.coin.toLowerCase();

  if (jsonData && jsonData[coin]) {
    res.json(jsonData[coin]);
  } else {
    res.status(404).json({
      "status_code": "404",
      "status_msg": "Coin not Found",
      "time_stamp": Date.now(),
      "request": `Error occurred with {${coin}}`
    });
  }
});



app.get('/api/prices', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'prices.json');
  res.sendFile(indexPath);
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


