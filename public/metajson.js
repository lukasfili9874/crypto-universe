async function fetchGlobalMetrics() {
    try {
        const response = await fetch('http://localhost:3030/api/crypto');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        let cryptoDataDiv = document.getElementById('fetchDiv');

        let content = '';
        data.data.slice(0, 4).forEach(coin => {
            content += `
                <tr>
                    <td>${coin.cmc_rank}</td>
                    <td>${coin.name}</td>
                    <td>${coin.symbol}</td>
                </tr>
            `;
        });

        cryptoDataDiv.innerHTML = content;
    } catch (error) {
        console.error('Error fetching crypto data:', error);
    }
}

fetchGlobalMetrics();
