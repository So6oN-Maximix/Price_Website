const dashboardViewer = document.getElementById("dashboard-viewer");
const ordersViewer = document.getElementById("view-orders");
const settingsViewer = document.getElementById("view-settings");
const viewers = [dashboardViewer, ordersViewer, settingsViewer];

const dashboardTabBtn = document.getElementById("tab-dashboard");
const ordersTabBtn = document.getElementById("tab-orders");
const settingsTab = document.getElementById("tab-settings");
const menuButtons = [dashboardTabBtn, ordersTabBtn, settingsTab];

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
    const profileLink = document.getElementById("nav-profile-link");
    const cartElement = document.getElementById("nav-cart-link");
    if (username) {
        if (profileLink) profileLink.href = "/profile";
        if (cartElement) cartElement.href = "/cart";
        if (usernameElement) usernameElement.textContent = username;
        if (avatarLettersElement) avatarLettersElement.textContent = username.split("")[0].toUpperCase();
    } else {
        if (window.location.pathname === "/profile") window.location.href = "/login";
    }
}

window.addEventListener("DOMContentLoaded", checkAuthentification);
document.getElementById("logout-btn").addEventListener("click", () => {
    document.cookie = "session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
});

menuButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => {
        btn.classList.add("active");
        menuButtons.forEach((button, idx) => {
            if (idx != index) {
                if (button.classList.contains("active")) {
                    button.classList.remove("active");
                }
            }
        });
        viewers.forEach((viewer, idx) => {
            if (idx === index) {
                viewer.style.display = "flex";
            } else {
                viewer.style.display = "none";
            }
        });
    });
});