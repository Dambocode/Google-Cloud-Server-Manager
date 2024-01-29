// Utility Functions
function toLocalReadableTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString(); // Converts to local time in a readable format
}

function addOptions(dropdown, options) {
    options.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option;
        optElement.textContent = option;
        dropdown.appendChild(optElement);
    });
}