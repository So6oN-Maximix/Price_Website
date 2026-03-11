const avatarLettersElement = document.getElementById("avatar-letters");
const usernameElement = document.getElementById("username");
const creationDateElement = document.getElementById("creation-date");

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
}

async function checkAuthentification() {
    const username = getCookie("username");
    if (username) {
        console.log(username);
        usernameElement.textContent = username;
        avatarLettersElement.textContent = username.split("")[0].toUpperCase();
        const rawDate = getCookie("date");
        const creationDate = new Date(rawDate, "fr-FR");
        creationDateElement.textContent = creationDate;
    } else {
        if (window.location.pathname === "/profile") window.location.href = "/login";
    }
}

window.addEventListener("DOMContentLoaded", checkAuthentification);