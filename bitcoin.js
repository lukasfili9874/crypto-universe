const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const axios = require('axios');





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

app.get('/api/cryptocurrency/listings/latest', async (req, res) => {
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': '6b6e99ca-2f54-4ec5-8921-2cd2b704886e',
      },
    });
    res.json(response.data);
  } catch (ex) {
    console.error(ex);
    res.status(500).send('Error fetching data');
  }
});

app.get('/api/cryptocurrency/listings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coin-list.json'));
});

app.get('/api/cryptocurrency/tags/:tagName', async (req, res) => {
  const tagName = req.params.tagName.toLowerCase();
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': '6b6e99ca-2f54-4ec5-8921-2cd2b704886e',
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

app.get('/api/cryptocurrency/tags', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tag-list.json'));
});

;

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
