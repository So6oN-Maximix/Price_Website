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

async function addToPassedOrders(cartList) {
    const ordersContainer = document.getElementById("orders-container");
    const globalCard = document.createElement("div");
    globalCard.classList.add("order-summary", "glass-card");
    globalCard.style.marginBottom = "25px";

    const cardHeaderDiv = document.createElement("div");
    cardHeaderDiv.classList.add("order-header");
    const orderNumber = document.createElement("span");
    orderNumber.textContent = "Commande n°CMD-84920";
    const orderStatus = document.createElement("span");
    orderStatus.classList.add("status-badge", "status-pending");
    orderStatus.textContent = "Livrée";

    const orderDate = document.createElement("p");
    orderDate.textContent = `Commandé le ${cartList[0].date}`;

    const divider = document.createElement("div");
    divider.classList.add("summary-divider");

    cardHeaderDiv.appendChild(orderNumber);
    cardHeaderDiv.appendChild(orderStatus);

    globalCard.appendChild(cardHeaderDiv);
    globalCard.appendChild(orderDate);
    globalCard.appendChild(divider);

    let totalPrice = 0;
    for (const productCartInfo of cartList) {
        let summaryRowDiv = document.createElement("div");
        summaryRowDiv.classList.add("summary-row");
        const productLine = document.createElement("span");
        const productInfo = await fetch (`/api/get-product-info?id=${productCartInfo.product_id}`);
        const priceLine = document.createElement("span");
        if (productInfo.ok) {
            const productData = await productInfo.json();
            productLine.textContent = `${productCartInfo.nbr_item}x ${productData.name} (${productData.type})`;
            priceLine.textContent = `${productData.price}€`;
            totalPrice += Number(productData.price) * Number(productCartInfo.nbr_item);
        } else {
            productLine.textContent = "Produit introuvable";
            priceLine.textContent = "0.00€";
        }
        summaryRowDiv.appendChild(productLine);
        summaryRowDiv.appendChild(priceLine);

        globalCard.append(summaryRowDiv);
    }

    const totalPriceLine = document.createElement("div");
    totalPriceLine.classList.add("order-total");
    totalPriceLine.textContent = `Total : ${totalPrice.toFixed(2)}€`;

    const divider2 = document.createElement("div");
    divider2.classList.add("summary-divider");

    globalCard.appendChild(divider2);
    globalCard.appendChild(totalPriceLine);
    ordersContainer.appendChild(globalCard);

    // AJOUTER UNE LIGNE LIVRAISON
}

async function loadPassedOrders() {
    const orderContainerDiv = document.getElementById("orders-container");
    const serverResponse = await fetch("/api/loadOrders");
    if (serverResponse.ok) {
        const ordersList = await serverResponse.json();
        orderContainerDiv.innerHTML = "";
        if (ordersList.length === 0) {
            orderContainerDiv.innerHTML = "<p style='color: rgba(255,255,255,0.5);'>Vous n'avez passé aucune commande.</p>";
            return;
        }
        for (const order of ordersList) {
            await addToPassedOrders(order);
        }
    }
}

async function loadDatas(viewerID) {
    if (viewerID === "view-orders") {
        loadPassedOrders();
    }
}

window.addEventListener("DOMContentLoaded", checkAuthentification);
document.getElementById("logout-btn")?.addEventListener("click", () => {
    document.cookie = "session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
});

if (dashboardTabBtn) menuButtons.forEach((btn, index) => {
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
                loadDatas(viewer.id);
            } else {
                viewer.style.display = "none";
            }
        });
    });
});