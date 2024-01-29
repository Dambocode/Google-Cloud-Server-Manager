function loadProjects() {
    fetch('/projects')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const projectDropdown = document.getElementById('projectDropdown');
            projectDropdown.innerHTML = ''; // Clear existing options

            data.forEach(project => {
                let option = document.createElement('option');
                option.value = project.id; // Assuming each project has an 'id'
                option.textContent = project.name; // And a 'name'
                projectDropdown.appendChild(option);
            });
        })
        .catch(error => console.error('There was a problem with the fetch operation:', error));
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
function loadInstancesForProject(projectId) {
    fetch(`/instances?projectId=${projectId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // Sort the instances by last start date in descending order
            data.sort((a, b) => new Date(b.last_start) - new Date(a.last_start));

            const instanceSection = document.getElementById('instanceSection');
            instanceSection.innerHTML = ''; // Clear existing content

            data.forEach(instance => {
                let div = document.createElement('div');
                div.textContent = instance.name; // Assuming each instance has a 'name'
                instanceSection.appendChild(div);
            });
        })
        .catch(error => console.error('There was a problem with the fetch operation:', error));
}


function initiateLogin() {
    fetch('/login')
        .then(response => {
            if (response.ok) {
                // Assuming the server redirects to the Google OAuth page
                return response.json();
            } else {
                throw new Error('Login failed');
            }
        })
        .then(data => {
            document.getElementById("loginButton").innerHTML = data; // Replace the current page with the OAuth page
        })
        .catch(error => console.error('Error:', error));
}
function initiateLogout() {
    fetch('/logout')
        .then(response => {
            if (response.ok) {
                // Assuming the server successfully logs out the user
                alert('Logged out successfully.');
                window.location.reload(); // Reload the page or redirect to the login page
            } else {
                throw new Error('Logout failed');
            }
        })
        .catch(error => console.error('Error:', error));
}

function loadMods(modType) {
    fetch(`/api/getMods?type=${modType}`)
        .then(response => response.json())
        .then(mods => {
            const modListTbody = document.getElementById('modList').querySelector('tbody');
            modListTbody.innerHTML = ''; // Clear existing mods

            mods.forEach(mod => {
                const row = modListTbody.insertRow();
                row.insertCell().textContent = mod
                const deleteCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.onclick = () => deleteMod(mod);
                deleteCell.appendChild(deleteButton);

                // Add option in the select menu
                const selectOption = document.createElement('option');
                selectOption.value = mod;
                selectOption.textContent = mod;
            });
        })
        .catch(error => console.error('Error:', error));
}
function deleteMod(modId) {
    fetch(`/api/deleteMod?name=${modId}&type=${document.getElementById('modType').value}`, { method: 'DELETE' })
        .then(response => {
            if(response.ok) {
                loadMods(document.getElementById('modType').value); // Reload the mods
            } else {
                throw new Error('Error in deleting mod');
            }
        })
        .catch(error => console.error('Error:', error));
}

function loadModListDropdown(modType) {
    const modListDropdown = document.getElementById('modListDropdown');

    fetch(`/api/getMods?type=${modType}`) // Use the modType in the API request
        .then(response => response.json())
        .then(mods => {
            modListDropdown.innerHTML = ''; // Clear existing options
            mods.forEach(mod => {
                console.log(mod);
                const option = document.createElement('option');
                option.value = mod; // Use a unique identifier for the mod
                option.textContent = mod; // Use the name of the mod for display
                modListDropdown.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading mods:', error));
}




loadInstances();
setInterval(loadInstances, 1000); // Refresh the instances every 1 second(s)