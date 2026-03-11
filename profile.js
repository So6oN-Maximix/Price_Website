function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
}

async function checkAuthentification() {
    const avatarLettersElement = document.getElementById("avatar-letters");
    const usernameElement = document.getElementById("username");
    const username = getCookie("username");
    if (username) {
        if (profileLink) profileLink.href = "/profile";
        if (usernameElement) usernameElement.textContent = username;
        if (avatarLettersElement) avatarLettersElement.textContent = username.split("")[0].toUpperCase();
    } else {
        if (window.location.pathname === "/profile") window.location.href = "/login";
    }
}

const profileLink = document.getElementById("nav-profile-link");

window.addEventListener("DOMContentLoaded", checkAuthentification);
document.getElementById("logout-btn").addEventListener("click", () => {
    document.cookie = "session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
});