document.addEventListener('DOMContentLoaded', function () {
    // Game Dropdown Change Event
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


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // // Login Button Click Event
    // const loginButton = document.getElementById('loginButton');
    // loginButton.addEventListener('click', function () {
    //     initiateLogin();
    // });

    // // Logout Button Click Event
    // const logoutButton = document.getElementById('logoutButton');
    // logoutButton.addEventListener('click', function () {
    //     initiateLogout();
    // });


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    // Project Dropdown Change Event
    const projectDropdown = document.getElementById('projectDropdown');
    projectDropdown.addEventListener('change', function () {
        loadInstancesForProject(this.value);
    });

    // Sort Dropdown Change Event
    const sortDropdown = document.getElementById('sortDropdown');
    sortDropdown.addEventListener('change', function () {
        loadInstances(this.value);
    });

    // Mod Upload Change Event
    const modUpload = document.getElementById('modUpload');
    modUpload.addEventListener('change', function(event) {
        let modType = document.getElementById('modType').value;
        // ... code for handling mod upload ...
    });

    // Server Type Dropdown Change Event (For Mods)
    const serverTypeDropdownForMods = document.getElementById('serverTypeDropdown');
    serverTypeDropdownForMods.addEventListener('change', function () {
        loadModListDropdown(this.value);
    });

    // Create and Settings Popup Initialization
    createPopup("create");
    createPopup("settings");

    // Additional event listeners can be added here as needed
});
