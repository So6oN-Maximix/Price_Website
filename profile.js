const avatarLettersElement = document.getElementById("avatar-letters");
const usernameElement = document.getElementById("username");

function getUsername(cookie) {
    const userRow = cookie.find(row => row.startsWith("username="));
    if (userRow) {
        const username = userRow.split("=")[1];
        console.log("Pseudo trouvé :", username);
        return username;
    }
    return "Inconnu";
}

async function checkAuthentification() {
    const cookie = document.cookie.split(";");
    const userCookie = cookie.find(c => c.trim().startsWith('username='));
    if (userCookie) {
        const username = getUsername(cookie);
        usernameElement.textContent = username;
        avatarLettersElement = username[0].toString().toUpperCase();
    } else {
        if (window.location.pathname === "/profile") window.location.href = "/login";
    }
}

window.addEventListener("DOMContentLoaded", checkAuthentification);