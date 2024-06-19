document.addEventListener('DOMContentLoaded', () => {
    const eventSource = new EventSource('/events');

    eventSource.onmessage = function(event) {
        document.getElementById('packet').innerText = event.data || 'No packet received';
    };

    eventSource.onerror = function() {
        console.error('EventSource failed.');
    };
});
