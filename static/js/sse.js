var source = new EventSource('/stream');  // Connect to the SSE endpoint

source.onmessage = function(event) {
    // Create a new log entry
    var logEntry = document.createElement('div');
    logEntry.textContent = event.data;

    // Append the log entry to the container
    var logContainer = document.getElementById('log-container');
    logContainer.appendChild(logEntry);

    // Auto-scroll to the bottom of the container
    logContainer.scrollTop = logContainer.scrollHeight;
};

source.onerror = function(error) {
    console.error("Failed to connect to the log stream", error);
    // Optionally, handle reconnection or show a message to the user
};