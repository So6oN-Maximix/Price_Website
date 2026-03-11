const avatarLettersElement = document.getElementById("user-avatar");
const usernameElement = document.getElementById("username");

function getUsername(cookie) {
    const splitCookie = cookie.split("; ");
    const userRow = splitCookie.find(row => row.startsWith("username="));
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
        const username = getUsername();
        usernameElement.textContent = username;
        avatarLettersElement = username[0].toString().toUpperCase();
    } else {
        if (window.location.pathname === "/profile") window.location.href = "/login";
    }
}