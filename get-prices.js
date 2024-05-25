const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Funktion zum Abrufen des Bitcoin-Preises
async function fetchBitcoinPrice() {
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': '6b6e99ca-2f54-4ec5-8921-2cd2b704886e',
      },
      params: {
        symbol: 'BTC'
      }
    });
    return response.data.data.BTC; // Nur die relevanten Daten für Bitcoin extrahieren
  } catch (ex) {
    console.error('Fehler beim Abrufen des Bitcoin-Preises:', ex);
    throw ex;
  }
}

// Funktion zum Aktualisieren der JSON-Datei mit Bitcoin-Preis
async function updateBitcoinPriceInFile() {
  const bitcoinData = await fetchBitcoinPrice();
  const dataPath = path.join(__dirname, 'public', 'cryptocurrency-metadata.json');

  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der JSON-Datei:', err);
      throw err;
    }

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (err) {
      console.error('Fehler beim Parsen der JSON-Daten:', err);
      throw err;
    }

    // Preis für Bitcoin aktualisieren
    if (jsonData.btc) {
      jsonData.btc.prices = {
        usd: bitcoinData.quote.USD.price,
        eur: bitcoinData.quote.EUR ? bitcoinData.quote.EUR.price : null, // Beispiel für mehrere Währungen
        last_updated: bitcoinData.quote.USD.last_updated
      };
    }

    fs.writeFile(dataPath, JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error('Fehler beim Speichern der aktualisierten JSON-Daten:', err);
        throw err;
      }
      console.log('Bitcoin-Preis erfolgreich in cryptocurrency-metadata.json aktualisiert.');
    });
  });
}

// Skript ausführen
updateBitcoinPriceInFile();
