// UI Manipulation Functions

function createPopup(name) {
    var modal = document.getElementById(`${name}Modal`);
    var btn = document.getElementById(`${name}Button`);
    var span = modal.getElementsByClassName("close")[0];

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

function closePopups() {
    // Assuming you have multiple popups and they have a common class 'modal'
    var modals = document.getElementsByClassName('modal');
    for (var i = 0; i < modals.length; i++) {
        modals[i].style.display = 'none';
    }

    // Alternatively, if you want to close specific popups, you can select them by ID and close them individually
    // Example:
    // var editModal = document.getElementById("editModal");
    // var createModal = document.getElementById("createModal");
    // if (editModal) editModal.style.display = "none";
    // if (createModal) createModal.style.display = "none";
    // ... and so on for other modals
}

// You can add more UI-related functions here if needed
