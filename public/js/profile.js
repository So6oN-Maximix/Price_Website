const dashboardViewer = document.getElementById("dashboard-viewer");
const ordersViewer = document.getElementById("view-orders");
const postsViewer = document.getElementById("view-posts");
const settingsViewer = document.getElementById("view-settings");
const viewers = [dashboardViewer, ordersViewer, postsViewer, settingsViewer];

const dashboardTabBtn = document.getElementById("tab-dashboard");
const ordersTabBtn = document.getElementById("tab-orders");
const postsTabBtn = document.getElementById("tab-posts");
const settingsTab = document.getElementById("tab-settings");
const menuButtons = [dashboardTabBtn, ordersTabBtn, postsTabBtn, settingsTab];

let currentUserId = null;

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
}

async function checkAuthentification() {
    const usernameElement = document.getElementById("username");
    const username = getCookie("username");
    const profileLink = document.getElementById("nav-profile-link");
    const cartElement = document.getElementById("nav-cart-link");
    if (username) {
        if (profileLink) profileLink.href = "/profile";
        if (cartElement) cartElement.href = "/cart";
        if (usernameElement) usernameElement.textContent = username;
        const imageJSONQuery = await fetch(`/api/get-image?username=${username}`);
        if (imageJSONQuery.ok) {
            const imageJSON = await imageJSONQuery.json();
            const profilPicElement = document.getElementById("current-pic");
            if (profilPicElement) profilPicElement.src = imageJSON.profil_pic;
        }
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
    const dateObj = new Date(cartList[0].date);
    const datePart = dateObj.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    const timePart = dateObj.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    }).replace(":", "h");
    orderDate.textContent = `Commandé le ${datePart} à ${timePart}`;

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
            let prixUnitaireFinal = Number(productData.price);
            let totalLigneAncien = prixUnitaireFinal * Number(productCartInfo.nbr_item);
            let totalLigneNouveau = 0;
            if (productData.promo) {
                prixUnitaireFinal = prixUnitaireFinal - (prixUnitaireFinal * (Number(productData.promo) / 100));
                totalLigneNouveau = prixUnitaireFinal * Number(productCartInfo.nbr_item);

                priceLine.style.display = "flex";
                priceLine.style.flexDirection = "column";
                priceLine.style.alignItems = "flex-end";

                const ancienPrix = document.createElement("span");
                ancienPrix.textContent = `${totalLigneAncien.toFixed(2)}€`;
                ancienPrix.style.textDecoration = "line-through";
                ancienPrix.style.color = "rgba(255, 255, 255, 0.4)";
                ancienPrix.style.fontSize = "0.85rem";

                const nouveauPrix = document.createElement("span");
                nouveauPrix.textContent = `${totalLigneNouveau.toFixed(2)}€`;
                nouveauPrix.style.fontWeight = "bold";
                priceLine.appendChild(ancienPrix);
                priceLine.appendChild(nouveauPrix);
                totalPrice += totalLigneNouveau;
            } else {
                totalLigneNouveau = totalLigneAncien;
                priceLine.style.fontWeight = "bold";
                priceLine.textContent = `${totalLigneNouveau.toFixed(2)}€`;
                totalPrice += totalLigneNouveau;
            }
        } else {
            productLine.textContent = "Produit introuvable";
            priceLine.textContent = "0.00€";
        }
        summaryRowDiv.appendChild(productLine);
        summaryRowDiv.appendChild(priceLine);

        globalCard.append(summaryRowDiv);
    }

    const deliveryRowLine = document.createElement("div");
    deliveryRowLine.classList.add("summary-row");
    const deliverySpan = document.createElement("span");
    deliverySpan.textContent = "Livraison";
    const deliveryPrice = document.createElement("span");
    deliveryPrice.style.fontWeight = "bold";
    deliveryPrice.textContent = `${(totalPrice * 0.15).toFixed(2)}€`;
    deliveryRowLine.appendChild(deliverySpan);
    deliveryRowLine.appendChild(deliveryPrice);

    const totalPriceLine = document.createElement("div");
    totalPriceLine.classList.add("order-total");
    totalPriceLine.textContent = `Total : ${(totalPrice * 1.15).toFixed(2)}€`;

    const divider2 = document.createElement("div");
    divider2.classList.add("summary-divider");

    globalCard.appendChild(deliveryRowLine);
    globalCard.appendChild(divider2);
    globalCard.appendChild(totalPriceLine);
    ordersContainer.appendChild(globalCard);
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

async function loadSettingsInfos() {
    const username = getCookie("username");
    const usernameReplace = document.getElementById("setting-username");
    usernameReplace.value = username;
    const getEmailResponse = await fetch("/api/get-email");
    if (getEmailResponse.ok) {
        const email = await getEmailResponse.json();
        const emailReplace = document.getElementById("setting-email");
        emailReplace.value = email;
    }
}

async function loadPosts() {
    if (!currentUserId) {
        try {
            const userRes = await fetch("/api/current-user-id");
            if (userRes.ok) {
                currentUserId = await userRes.json();
            }
        } catch (error) {
            console.error("Erreur lors de la récupération de l'ID utilisateur");
        }
    }

    const loadPostFetch = await fetch("/api/load-posts");
    if (loadPostFetch.ok) {
        const postList = await loadPostFetch.json();
        if (postList.length > 0) {
            document.getElementById("my-posts-container").innerHTML = "";
            for (const post of postList) {
                addToComment(post, "my-posts-container");
            }
        }else {
            document.getElementById("my-posts-container").innerHTML = "<p style='color: rgba(255,255,255,0.5); text-align: center; width: 100%; padding: 40px 0;'>Vous n'avez pas encore publié de setup.</p>";
        }
    }
}

async function loadDatas(viewerID) {
    if (viewerID === "view-orders") {
        await loadPassedOrders();
    } else if (viewerID === "view-settings") {
        await loadSettingsInfos();
    } else if (viewerID === "view-posts") {
        await loadPosts();
    }
}

window.addEventListener("DOMContentLoaded", checkAuthentification);
document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await fetch("/api/logout");
    window.location.href = "/";
});

document.getElementById("profile-pic-input")?.addEventListener("change", async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result;
        document.getElementById("current-pic").src = base64Image;
        try {
            const response = await fetch("/api/update-profile-pic", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({profil_pic: base64Image})
            });
            if(response.ok) {
                console.log("Photo de profil sauvegardée en BDD !");
            } else {
                alert("Erreur lors de la sauvegarde.");
            }
        } catch (error) {
            console.error("Erreur d'upload :", error);
        }
    };
    reader.readAsDataURL(file);
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

/* ============================================================== */
/* MENU DÉROULANT DE NAVIGATION (ENGRENAGE)                       */
/* ============================================================== */

function toggleNavMenu(event, dropdownId) {
    event.preventDefault(); // Empêche le clic de faire sauter la page
    
    // 1. On ferme tous les autres sous-menus ouverts
    document.querySelectorAll('.nav-dropdown-menu').forEach(menu => {
        if(menu.id !== dropdownId) menu.classList.remove('show');
    });

    // 2. On ouvre ou on ferme celui qu'on a cliqué
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// 3. Fermer le menu si on clique n'importe où ailleurs sur l'écran
document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-item-dropdown')) {
        document.querySelectorAll('.nav-dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});