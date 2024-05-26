const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Statische Dateien (HTML, CSS, JS) bereitstellen
app.use(express.static(path.join(__dirname, 'public')));


// JSON-Daten einmal lesen
let jsonData = null;
const dataPath = path.join(__dirname, 'public', 'cryptocurrency-metadata.json');

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

// Routen
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/cryptocurrency/metajson', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'metajson.json'));
});

app.get('/api/documentation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'doc.html'));
});

app.get('/api/cryptocurrency/listings/:coin', (req, res) => {
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

app.get('/api/cryptocurrency/listings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coin-list.json'));
});

app.get('/api/cryptocurrency/tags/:tagName', (req, res) => {
  const tagName = req.params.tagName.toLowerCase();
  const filteredCoins = {};

  // Durchlaufe alle Coins und überprüfe, ob der Tag vorhanden ist
  Object.keys(jsonData).forEach(coinSymbol => {
    const coinData = jsonData[coinSymbol];
    if (coinData.tags && coinData.tags.includes(tagName)) {
      filteredCoins[coinSymbol] = coinData;
    }
  });

  if (Object.keys(filteredCoins).length > 0) {
    res.json(filteredCoins);
  } else {
    res.status(404).json({
      "status_code": "404",
      "status_msg": "Coins not Found with tag",
      "time_stamp": Date.now(),
      "request": `Error occurred with tag: {${tagName}}`
    });
  }
});

app.get('/api/cryptocurrency/tags', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tag-list.json'));
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
