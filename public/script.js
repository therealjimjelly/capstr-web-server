async function fetchPacket() {
    const response = await fetch('/packet');
    const data = await response.json();
    document.getElementById('packet').innerText = data.packet || 'No packet received';
}

setInterval(fetchPacket, 1000); // Fetch the latest packet every second
