


document.addEventListener('DOMContentLoaded', function () {
    const gameDropdown = document.getElementById('gameDropdown');
    const serverTypeDropdown = document.getElementById('serverTypeDropdown');

    gameDropdown.addEventListener('change', function () {
        const game = this.value;
        serverTypeDropdown.innerHTML = '';

        if (game === 'Minecraft') {
            addOptions(serverTypeDropdown, ['vanilla', 'spigot', 'magma', 'forge']);
        } else if (game === 'Palworld') {
            addOptions(serverTypeDropdown, ['vanilla', 'modded']);
        }
    });
});

function addOptions(dropdown, options) {
    options.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option;
        optElement.textContent = option;
        dropdown.appendChild(optElement);
    });
}
document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.getElementById('toggleTheme');
    toggleButton.addEventListener('click', function () {
        document.body.classList.toggle('light-mode');
        toggleButton.textContent = document.body.classList.contains('light-mode') ? 'Toggle Dark Mode' : 'Toggle Light Mode';
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const projectDropdown = document.getElementById('projectDropdown');

    loginButton.addEventListener('click', function () {
        initiateLogin();
    });

    logoutButton.addEventListener('click', function () {
        initiateLogout();
    });

    projectDropdown.addEventListener('change', function () {
        loadInstancesForProject(this.value);
    });

    // Define functions for initiateLogin, initiateLogout, loadProjects, and loadInstancesForProject
});
function toLocalReadableTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString(); // Converts to local time in a readable format
}
function loadInstances() {
    fetch('/api/loadInstances')
        .then(response => response.json())
        .then(data => {

            // check sort dropdown and sort accordingly
            const sortDropdown = document.getElementById('sortDropdown');
            if (sortDropdown.value === 'last_start') {
                data.sort((a, b) => new Date(b.last_start) - new Date(a.last_start));
            } else if (sortDropdown.value === 'last_stop') {
                data.sort((a, b) => new Date(b.last_stop) - new Date(a.last_stop));
            } else if (sortDropdown.value === 'creation') {
                data.sort((a, b) => new Date(b.creation) - new Date(a.creation));
            } else if (sortDropdown.value === 'name') {
                data.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortDropdown.value === 'zone') {
                data.sort((a, b) => a.zone.localeCompare(b.zone));
            } else if (sortDropdown.value === 'machine_type') {
                data.sort((a, b) => a.machine_type.localeCompare(b.machine_type));
            } else if (sortDropdown.value === 'disk_size') {
                data.sort((a, b) => a.disk_size - b.disk_size);
            } else if (sortDropdown.value === 'status') {
                data.sort((a, b) => a.status.localeCompare(b.status));
            }

            let tableBody = document.getElementById('instancesTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = ""; // Clear existing data
            data.forEach(instance => {
                let row = tableBody.insertRow();
                let actions;


                if (instance.status === "RUNNING") {
                    actions = '<div class="action-container"> <button class="stop-instance" onclick="stopInstance(\'' + instance.name + '\')">Stop</button><button class="editButton">Edit</button><button class="delete-instance" onclick="deleteInstance(\'' + instance.name + '\')">Delete</button></div>';
                } else {
                    actions = '<div class="action-container"> <button class="start-instance" onclick="startInstance(\'' + instance.name + '\')">Start</button><button class="editButton">Edit</button><button class="delete-instance" onclick="deleteInstance(\'' + instance.name + '\')">Delete</button></div>';
                }

                if (instance.status === "RUNNING") {
                    row.insertCell().textContent = instance.net_i_p;
                }

                else {
                    row.insertCell().textContent = "Server Stopped";
                }

                // Insert cells in the order of your table headers
                row.insertCell().textContent = instance.name;
                row.insertCell().textContent = instance.zone;
                row.insertCell().textContent = instance.machine_type;
                row.insertCell().textContent = instance.disk_size;
                row.insertCell().textContent = toLocalReadableTime(instance.creation);
                row.insertCell().textContent = toLocalReadableTime(instance.last_start);
                row.insertCell().textContent = toLocalReadableTime(instance.last_stop);
                row.insertCell().textContent = instance.status;
                // Insert action buttons
                let actionCell = row.insertCell();
                actionCell.innerHTML = actions;
                let editButton = row.querySelector('.editButton');
                if (editButton) {
                    editButton.onclick = function () {
                        editInstance(instance.name);
                    }
                }

            });
        })
        .catch(error => console.error('Error:', error));
}

function startInstance(instanceName) {
    fetch('/api/startInstance?instanceName=' + instanceName)
        .then(response => {
            if (response.ok) {
                // alert('Instance started successfully.');
                loadInstances();
            } else {
                throw new Error('Instance start failed');
            }
        })
        .catch(error => console.error('Error:', error));
}

function stopInstance(instanceName) {
    fetch('/api/stopInstance?instanceName=' + instanceName)
        .then(response => {
            if (response.ok) {
                // alert('Instance stopped successfully.');
                loadInstances();
            } else {
                throw new Error('Instance stop failed');
            }
        })
        .catch(error => console.error('Error:', error));
}

function editInstance(instanceName) {
    // Populate modal if necessary and open it
    var modal = document.getElementById("editModal");
    modal.style.display = "flex";
    modal.style.justifyContent = "center";

    // Additional logic to populate the modal...
}

// Create Server Popup

function createPopup(name) {


    var modal = document.getElementById(`${name}Modal`);
    var btn = document.getElementById(`${name}Button`);
    var span = document.getElementsByClassName("close")[0];

    btn.onclick = function () {
        modal.style.display = "flex";
        modal.style.justifyContent = "center";
    }

    span.onclick = function () {
        modal.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}
// Create the popups for the top buttons
document.addEventListener('DOMContentLoaded', createPopup("create"));
document.addEventListener('DOMContentLoaded', createPopup("settings"));



// Close Popups
document.addEventListener('DOMContentLoaded', function () {
    var editModal = document.getElementById("editModal");
    var createModal = document.getElementById("createModal");

    // Close event for Edit Modal
    var editCloseBtn = editModal.getElementsByClassName("close")[0];
    editCloseBtn.onclick = function () {
        editModal.style.display = "none";
    }

    // Close event for Create Modal
    var createCloseBtn = createModal.getElementsByClassName("close")[0];
    createCloseBtn.onclick = function () {
        createModal.style.display = "none";
    }
    // close event for Settings Modal
    var settingsCloseBtn = settingsModal.getElementsByClassName("close")[0];
    settingsCloseBtn.onclick = function () {
        settingsModal.style.display = "none";
    }

    // Close modal if clicked outside
    window.onclick = function (event) {
        if (event.target == editModal) {
            editModal.style.display = "none";
        }
        if (event.target == createModal) {
            createModal.style.display = "none";
        }
        if (event.target == settingsModal) {
            settingsModal.style.display = "none";
        }
    }
});



// Sort By Dropdown
document.addEventListener('DOMContentLoaded', function () {
    const sortDropdown = document.getElementById('sortDropdown');
    sortDropdown.addEventListener('change', function () {
        loadInstances(this.value); // Pass the selected sorting attribute
    });
});

// Display additional settings depending on selected server type (Minecraft)
document.addEventListener('DOMContentLoaded', function () {
    const serverTypeDropdown = document.getElementById('serverTypeDropdown');

    serverTypeDropdown.addEventListener('change', function () {
        const selectedServerType = this.value;
        const fileInputContainer = document.getElementById('fileInputContainer');

        if (selectedServerType === 'forge') {
            document.getElementsByClassName('minecraft-vanilla-options')[0].style.display = 'none';
            document.getElementsByClassName('minecraft-forge-options')[0].style.display = 'block';
        } if (selectedServerType === 'vanilla') {
            document.getElementsByClassName('minecraft-forge-options')[0].style.display = 'none';
            document.getElementsByClassName('minecraft-vanilla-options')[0].style.display = 'block';
        }

        else {
            // Clear the container if Forge is not selected
            document.getElementsByClassName('minecraft-forge-options')[0].style.display = 'none';
        }
    });
});

// Listen for new mods to be uploaded
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('modUpload').addEventListener('change', function (event) {
        let modType = document.getElementById('modType').value;
        const fileInput = event.target;
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', modType);

            // Send the file to the server using Fetch API
            fetch('/api/saveMod', {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Server returned an error response');
                    }
                })
                .then(data => {
                    console.log('Success:', data); // Handle success response
                })
                .catch(error => {
                    console.error('Error:', error); // Handle error response
                });
        }

    });
});

document.addEventListener('DOMContentLoaded', function () {
    const serverTypeDropdown = document.getElementById('serverTypeDropdown');

    serverTypeDropdown.addEventListener('change', function () {
        loadModListDropdown(this.value); // Call the function with the selected server type
    });

    // Load mods initially based on the default or initial server type
    loadModListDropdown(serverTypeDropdown.value);
});
document.getElementById('modUpload').addEventListener('change', function (event) {
    // ... existing file upload code ...
    const serverType = document.getElementById('serverTypeDropdown').value;
    loadModListDropdown(serverType); // Reload the mod list dropdown based on the current server type
});







// ...rest of your JavaScript code


loadInstances();

// Refresh every 5 seconds
setInterval(loadInstances, 10000);

// Initial load
// loadInstances();
