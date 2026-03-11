const avatarLettersElement = document.getElementById("avatar-letters");
const usernameElement = document.getElementById("username");
const creationDateElement = document.getElementById("creation-date");
const profileLink = document.getElementById("nav-profile-link");

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
}

async function checkAuthentification() {
    const username = getCookie("username");
    if (username) {
        if (profileLink) profileLink.href = "/profile";
        console.log(username);
        if (usernameElement) usernameElement.textContent = username;
        if (avatarLettersElement) avatarLettersElement.textContent = username.split("")[0].toUpperCase();
    } else {
        if (window.location.pathname === "/profile") window.location.href = "/login";
    }
}

window.addEventListener("DOMContentLoaded", checkAuthentification);