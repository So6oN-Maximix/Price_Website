const dashboardViewer = document.getElementById("dashboard-viewer");
const ordersViewer = document.getElementById("view-orders");
const creationsViewer = document.getElementById("view-creations");
const postsViewer = document.getElementById("view-posts");
const settingsViewer = document.getElementById("view-settings");
const viewers = [dashboardViewer, ordersViewer, creationsViewer, postsViewer, settingsViewer];

const dashboardTabBtn = document.getElementById("tab-dashboard");
const ordersTabBtn = document.getElementById("tab-orders");
const creationsTabBtn = document.getElementById("tab-creations");
const postsTabBtn = document.getElementById("tab-posts");
const settingsTabBtn = document.getElementById("tab-settings");
const menuButtons = [dashboardTabBtn, ordersTabBtn, creationsTabBtn, postsTabBtn, settingsTabBtn];

const dashboardTabBtnTel = document.getElementById("tab-dashboard-tel");
const ordersTabBtnTel = document.getElementById("tab-orders-tel");
const creationsTabBtnTel = document.getElementById("tab-creations-tel");
const postsTabBtnTel = document.getElementById("tab-posts-tel");
const settingsTabBtnTel = document.getElementById("tab-settings-tel");
const plusBtn = document.getElementById("plus-btn");
const menuButtonsTel = [
    dashboardTabBtnTel,
    ordersTabBtnTel,
    creationsTabBtnTel,
    postsTabBtnTel,
    settingsTabBtnTel,
    plusBtn
];

let currentUserId = null;

const personalInfoForm = document.getElementById("form-personal-info");

const deleteButton = document.querySelector(".delete-account-btn");
const deleteModal = document.getElementById("delete-account-modal");
const cancelButton = document.getElementById("cancel-delete-btn");
const confirmButton = document.getElementById("confirm-delete-btn");

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
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
    const orderStatusBadge = document.createElement("span");
    orderStatusBadge.classList.add("status-badge", "status-pending");
    const orderStatus = cartList[0].status === null ? "En cours de livraison" : cartList[0].status;
    orderStatusBadge.textContent = orderStatus;

    const orderDate = document.createElement("p");
    const dateObj = new Date(cartList[0].date);
    const datePart = dateObj.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    const timePart = dateObj
        .toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
        })
        .replace(":", "h");
    orderDate.textContent = `Commandé le ${datePart} à ${timePart}`;

    const divider = document.createElement("div");
    divider.classList.add("summary-divider");

    cardHeaderDiv.appendChild(orderNumber);
    cardHeaderDiv.appendChild(orderStatusBadge);

    globalCard.appendChild(cardHeaderDiv);
    globalCard.appendChild(orderDate);
    globalCard.appendChild(divider);

    let totalPrice = 0;
    for (const productCartInfo of cartList) {
        let summaryRowContainer = document.createElement("div");
        summaryRowContainer.style.display = "flex";
        summaryRowContainer.style.flexDirection = "column";
        summaryRowContainer.style.marginBottom = "15px";

        let topRow = document.createElement("div");
        topRow.classList.add("summary-row");
        topRow.style.marginBottom = "0";

        const productLine = document.createElement("span");
        const priceLine = document.createElement("span");

        if (productCartInfo.is_custom) {
            productLine.innerHTML = `<b>${productCartInfo.nbr_item}x</b> ✨ ${productCartInfo.custom_name}`;

            const itemTotal = Number(productCartInfo.custom_price) * Number(productCartInfo.nbr_item);
            priceLine.style.fontWeight = "bold";
            priceLine.textContent = `${itemTotal.toFixed(2)}€`;
            totalPrice += itemTotal;

            topRow.appendChild(productLine);
            topRow.appendChild(priceLine);
            summaryRowContainer.appendChild(topRow);

            const detailsLine = document.createElement("span");
            detailsLine.style.fontSize = "0.8rem";
            detailsLine.style.color = "rgba(255, 255, 255, 0.4)";
            detailsLine.style.marginTop = "4px";

            let parts = productCartInfo.custom_data;
            if (typeof parts === "string") parts = JSON.parse(parts);

            if (parts && parts.bouchon) {
                detailsLine.textContent = `Bouchon: ${parts.bouchon.name} | Corps: ${parts.corps.name} | Habillage: ${parts.habillage.name} | Socle: ${parts.socle.name}`;
                summaryRowContainer.appendChild(detailsLine);
            }
        } else {
            const productInfo = await fetch(`/api/get-product-info?id=${productCartInfo.product_id}`);

            if (productInfo.ok) {
                const productData = await productInfo.json();
                productLine.innerHTML = `<b>${productCartInfo.nbr_item}x</b> ${productData.name} <span style="font-size: 0.8rem; color: rgba(255,255,255,0.5);">(${productData.type})</span>`;

                let prixUnitaireFinal = Number(productData.price);
                let totalLigneAncien = prixUnitaireFinal * Number(productCartInfo.nbr_item);
                let totalLigneNouveau = 0;

                if (productData.promo) {
                    prixUnitaireFinal = prixUnitaireFinal - prixUnitaireFinal * (Number(productData.promo) / 100);
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
            topRow.appendChild(productLine);
            topRow.appendChild(priceLine);
            summaryRowContainer.appendChild(topRow);
        }

        globalCard.append(summaryRowContainer);
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

function addToPassedCustom(dataPack) {
    const globalCustomCard = document.createElement("div");
    globalCustomCard.classList.add("design-card", "glass-card");

    /* IMAGE */
    const imgDiv = document.createElement("div");
    imgDiv.classList.add("design-preview");
    const imgElem = document.createElement("img");
    imgElem.src = "https://placehold.co/80x80/transparent/white?text=🔥"; // A CHANGER

    imgDiv.appendChild(imgElem);

    /* INFORMATIONS */
    const customDiv = document.createElement("div");
    customDiv.classList.add("design-info");

    /* Header */
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("design-header-row");
    const titleElem = document.createElement("h4");
    titleElem.textContent = dataPack.custom_name;
    const priceElem = document.createElement("span");
    priceElem.classList.add("design-price-tag");
    priceElem.textContent = `${dataPack.custom_price}€`;

    headerDiv.appendChild(titleElem);
    headerDiv.appendChild(priceElem);

    /* Summary */
    const summaryList = document.createElement("ul");
    summaryList.classList.add("design-parts-summary");
    for (const type in dataPack.custom_data) {
        const typeElem = document.createElement("li");
        typeElem.innerHTML = `<span>${type.charAt(0).toUpperCase() + type.slice(1)}:</span> ${dataPack.custom_data[type].name}`;
        summaryList.appendChild(typeElem);
    }

    /* Action buttons */
    const actionsDiv = document.createElement("div");
    actionsDiv.classList.add("design-actions");
    const cartBtn = document.createElement("button");
    cartBtn.classList.add("reorder-btn");
    cartBtn.textContent = "Ajouter au panier";
    cartBtn.onclick = async () => {
        const response = await fetch("/api/add-custom-to-cart-from-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data_pack: dataPack })
        });
        if (!response.ok) {
            cartBtn.textContent = "Erreur (Non connecté ?)";
            cartBtn.classList.remove("loading");
        } else {
            cartBtn.textContent = "Ajouté ! ✓";
            cartBtn.classList.remove("loading");
            cartBtn.classList.add("success");
            showToast(`Custom ${dataPack.custom_name} ajouté au panier !`);
        }
        setTimeout(() => {
            cartBtn.textContent = "Ajouter au panier";
            cartBtn.classList.remove("success");
            cartBtn.disabled = false;
        }, 2500);
    };
    const customBtn = document.createElement("button");
    customBtn.classList.add("import-custom-btn");
    customBtn.textContent = "Importer le Custom";

    actionsDiv.appendChild(cartBtn);
    actionsDiv.appendChild(customBtn);

    /* Assembly */
    customDiv.appendChild(headerDiv);
    customDiv.appendChild(summaryList);
    customDiv.appendChild(actionsDiv);

    /* Bouton Corbeille (Suppression) */
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-creation-btn");
    deleteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    `;

    deleteBtn.addEventListener("click", async () => {
        if (confirm(`Es-tu sûr de vouloir supprimer la création "${dataPack.custom_name}" ?`)) {
            try {
                const response = await fetch("/api/delete-creation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ custom_name: dataPack.custom_name })
                });

                if (response.ok) {
                    globalCustomCard.style.transform = "scale(0.8)";
                    globalCustomCard.style.opacity = "0";
                    setTimeout(() => {
                        globalCustomCard.remove();
                        const container = document.getElementById("designs-container");
                        if (container.children.length === 0) {
                            container.innerHTML =
                                "<p style='color: rgba(255,255,255,0.5);'>Vous n'avez passé aucune personnalisation.</p>";
                        }
                    }, 300);
                    showToast(`Custom  ${dataPack.custom_name} supprimé !`, true);
                }
            } catch (error) {
                console.error("Erreur lors de la suppression:", error);
            }
        }
    });

    globalCustomCard.appendChild(deleteBtn);

    /* ASSEMBLY */
    globalCustomCard.appendChild(imgDiv);
    globalCustomCard.appendChild(customDiv);
    document.getElementById("designs-container").appendChild(globalCustomCard);
}

function loadCustomDashboard(dataPack) {
    const globalCustomCard = document.createElement("div");
    globalCustomCard.classList.add("design-card", "glass-card");

    /* PREVIEW */
    const previewDiv = document.createElement("div");
    previewDiv.classList.add("design-preview");
    globalCustomCard.appendChild(previewDiv);

    /* INFOS */
    const customInfo = document.createElement("div");
    customInfo.classList.add("design-info");
    const customTitle = document.createElement("h4");
    customTitle.textContent = dataPack.custom_name;
    customInfo.appendChild(customTitle);
    for (const type in dataPack.custom_data) {
        const typeElem = document.createElement("p");
        typeElem.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${dataPack.custom_data[type].name}`;
        customInfo.appendChild(typeElem);
    }
    globalCustomCard.appendChild(customInfo);
    document.getElementById("designs-mini-grid").appendChild(globalCustomCard);
}

async function loadLastOrder(orderInfo) {
    /* HEADER */
    const orderHeader = document.createElement("div");
    orderHeader.classList.add("order-header");

    const orderNumber = document.createElement("span");
    const randomStart = 458962;
    orderNumber.textContent = `N° ${randomStart + Number(orderInfo[0].cart_id)}`;
    const statusBadge = document.createElement("span");
    statusBadge.classList.add("status-badge");
    const currentStatus = orderInfo[0].status === null ? "En cours de livraison" : orderInfo[0].status;
    statusBadge.textContent = currentStatus;

    orderHeader.appendChild(orderNumber);
    orderHeader.appendChild(statusBadge);

    /* DATE */
    const dateLine = document.createElement("p");
    const postDate = new Date(orderInfo[0].date);
    const datePart = postDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    const timePart = postDate
        .toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
        })
        .replace(":", "h");
    dateLine.textContent = `Commandé le ${datePart} à ${timePart}`;

    /* PRICE */
    let totalPrice = 0;
    for (const product of orderInfo) {
        if (product.is_custom) {
            totalPrice += Number(product.custom_price);
        } else {
            const productInfoQuery = await fetch(`/api/get-product-info?id=${product.product_id}`);
            if (productInfoQuery.ok) {
                const productInfo = await productInfoQuery.json();
                const promoMultiplier = productInfo.promo ? 1 - Number(productInfo.promo) / 100 : 1;
                totalPrice += Number(productInfo.price) * promoMultiplier;
            }
        }
    }
    const priceLine = document.createElement("div");
    priceLine.classList.add("order-total");
    priceLine.textContent = `Total: ${(totalPrice * 1.15).toFixed(2)}€`;

    const lastOrderContainer = document.getElementById("order-summary");
    lastOrderContainer.appendChild(orderHeader);
    lastOrderContainer.appendChild(dateLine);
    lastOrderContainer.appendChild(priceLine);
}

async function loadDashboard() {
    const commandNumberContainer = document.getElementById("command-number");
    const designNumberContainer = document.getElementById("design-number");
    const loyaltyPointsContainer = document.getElementById("loyalty-pts");
    const serverResponse = await fetch("/api/load-dashboard");
    if (serverResponse.ok) {
        const response = await serverResponse.json();
        const commandNumber = response.command_nbr;
        const designNumber = response.design_nbr;
        const loyaltyPts = response.loyalty_pts;
        commandNumberContainer.textContent = commandNumber;
        designNumberContainer.textContent = designNumber;
        loyaltyPointsContainer.textContent = loyaltyPts;
    }

    const getLastsCustoms = await fetch("/api/get-lasts-customs");
    if (getLastsCustoms.ok) {
        document.getElementById("designs-mini-grid").innerHTML = "";
        const response = await getLastsCustoms.json();
        if (response.length === 0) {
            document.getElementById("designs-mini-grid").innerHTML =
                "<p style='color: rgba(255,255,255,0.5);'>Vous n'avez passé aucune personnalisation.</p>";
        } else {
            for (const customPack of response) {
                loadCustomDashboard(customPack);
            }
        }
    }

    const getLastOrder = await fetch("/api/get-last-order");
    if (getLastOrder.ok) {
        document.getElementById("order-summary").innerHTML = "";
        const response = await getLastOrder.json();
        if (response.length === 0) {
            document.getElementById("order-summary").innerHTML =
                "<p style='color: rgba(255,255,255,0.5);'>Vous n'avez passé aucune commande.</p>";
        } else {
            loadLastOrder(response);
        }
    }
}

async function loadPassedOrders() {
    const orderContainerDiv = document.getElementById("orders-container");
    const serverResponse = await fetch("/api/load-orders");
    if (serverResponse.ok) {
        const ordersList = await serverResponse.json();
        orderContainerDiv.innerHTML = "";
        if (ordersList.length === 0) {
            orderContainerDiv.innerHTML =
                "<p style='color: rgba(255,255,255,0.5);'>Vous n'avez passé aucune commande.</p>";
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

async function loadCreation() {
    const customContainer = document.getElementById("designs-container");
    const serverResponse = await fetch("/api/load-creations");
    if (serverResponse.ok) {
        const customList = await serverResponse.json();
        customContainer.innerHTML = "";
        if (customList.length === 0) {
            customContainer.innerHTML =
                "<p style='color: rgba(255,255,255,0.5);'>Vous n'avez passé aucune personnalisation.</p>";
            return;
        }
        for (const customPack of customList) {
            addToPassedCustom(customPack);
        }
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
        } else {
            document.getElementById("my-posts-container").innerHTML =
                "<p style='color: rgba(255,255,255,0.5); text-align: center; width: 100%; padding: 40px 0;'>Vous n'avez pas encore publié de setup.</p>";
        }
    }
}

async function loadDatas(viewerID) {
    if (viewerID === "dashboard-viewer") {
        await loadDashboard();
    } else if (viewerID === "view-orders") {
        await loadPassedOrders();
    } else if (viewerID === "view-settings") {
        await loadSettingsInfos();
    } else if (viewerID === "view-creations") {
        await loadCreation();
    } else if (viewerID === "view-posts") {
        await loadPosts();
    }
}

function showToast(message, remove = false) {
    let toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.classList.add("toast-container");
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement("div");
    toast.classList.add("toast");
    if (remove) toast.classList.add("remove");
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        ${message}
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove());
    }, 3000);
}

window.addEventListener("DOMContentLoaded", () => {
    checkAuthentification();
    if (dashboardViewer) loadDashboard();
});
document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await fetch("/api/logout");
    window.location.href = "/";
});
document.getElementById("logout-btn-2")?.addEventListener("click", async () => {
    await fetch("/api/logout");
    window.location.href = "/";
});

document.getElementById("profile-pic-input")?.addEventListener("change", async function (event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (e) {
        const base64Image = e.target.result;
        document.getElementById("current-pic").src = base64Image;
        try {
            const response = await fetch("/api/update-profile-pic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profil_pic: base64Image })
            });
            if (response.ok) {
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

if (dashboardTabBtn)
    menuButtons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            menuButtons.forEach((button) => button.classList.remove("active"));
            btn.classList.add("active");
            viewers.forEach((viewer, idx) => {
                if (viewer) {
                    if (idx === index) {
                        viewer.style.display = "flex";
                        loadDatas(viewer.id);
                    } else {
                        viewer.style.display = "none";
                    }
                }
            });
        });
    });

if (dashboardTabBtnTel)
    menuButtonsTel.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            menuButtonsTel.forEach((button) => button.classList.remove("active"));
            const btnText = btn.querySelector("span").innerHTML;
            if (btnText !== "Plus") {
                if (btnText === "Posts" || btnText === "Paramètres") {
                    plusBtn.classList.add("active");
                    document.getElementById("profile-dropup").classList.remove("show");
                } else {
                    btn.classList.add("active");
                }
                viewers.forEach((viewer, idx) => {
                    if (viewer) {
                        if (idx === index) {
                            viewer.style.display = "flex";
                            loadDatas(viewer.id);
                        } else {
                            viewer.style.display = "none";
                        }
                    }
                });
            }
        });
    });

if (deleteButton && deleteModal)
    deleteButton.addEventListener("click", async (event) => {
        event.preventDefault();
        deleteModal.classList.add("show");
        document.body.style.overflow = "hidden";

        cancelButton.addEventListener("click", () => {
            deleteModal.classList.remove("show");
            document.body.style.overflow = "auto";
        });

        window.addEventListener("click", (e) => {
            if (e.target === deleteModal) {
                deleteModal.classList.remove("show");
                document.body.style.overflow = "auto";
            }
        });

        confirmButton.addEventListener("click", async () => {
            const originalText = confirmButton.textContent;
            confirmButton.textContent = "Adieu...";
            confirmButton.disabled = true;

            try {
                const response = await fetch("/api/delete-account", {
                    method: "POST"
                });

                if (response.ok) {
                    window.location.href = "/";
                } else {
                    alert("Erreur lors de la suppression du compte.");
                    confirmButton.textContent = originalText;
                    confirmButton.disabled = false;
                }
            } catch (error) {
                console.error("Erreur:", error);
                confirmButton.textContent = originalText;
                confirmButton.disabled = false;
            }
        });
    });

const securityForm = document.getElementById("form-security");

if (securityForm)
    securityForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const oldPwd = document.getElementById("setting-old-pwd").value;
        const newPwd = document.getElementById("setting-new-pwd").value;
        const confirmPwd = document.getElementById("setting-confirm-pwd").value;
        const submitBtn = securityForm.querySelector("button");

        if (newPwd !== confirmPwd) {
            alert("Erreur : Le nouveau mot de passe et la confirmation ne correspondent pas !");
            return;
        }
        if (oldPwd === newPwd) {
            alert("Le nouveau mot de passe doit être différent de l'ancien.");
            return;
        }
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Mise à jour en cours...";
        submitBtn.disabled = true;

        try {
            const response = await fetch("/api/update-security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    old_password: oldPwd,
                    new_password: newPwd
                })
            });

            const data = await response.json();

            if (response.ok) {
                securityForm.reset();
                showToast("Mot de passe mis à jour avec succès !");
            } else {
                alert(data.message || "Erreur lors de la mise à jour.");
            }
        } catch (error) {
            console.error("Erreur de connexion:", error);
            alert("Erreur réseau, veuillez réessayer.");
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

if (personalInfoForm)
    personalInfoForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const newUsername = document.getElementById("setting-username").value;
        const newEmail = document.getElementById("setting-email").value;
        const submitBtn = personalInfoForm.querySelector("button");

        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Sauvegarde en cours...";
        submitBtn.disabled = true;

        try {
            const response = await fetch("/api/update-personal-info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: newUsername,
                    email: newEmail
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast("Informations mises à jour avec succès !");
                const usernameDisplay = document.getElementById("username");
                if (usernameDisplay) usernameDisplay.textContent = newUsername;
                if (data.new_profil_pic) {
                    const profilPicElement = document.getElementById("current-pic");
                    if (profilPicElement) profilPicElement.src = data.new_profil_pic;
                }
            } else {
                alert(data.message || "Erreur lors de la mise à jour.");
            }
        } catch (error) {
            console.error("Erreur réseau:", error);
            alert("Erreur réseau, veuillez réessayer.");
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

function toggleNavMenu(event, dropdownId, classSelected) {
    event.preventDefault();
    document.querySelectorAll(classSelected).forEach((menu) => {
        if (menu.id !== dropdownId) menu.classList.remove("show");
    });
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        dropdown.classList.toggle("show");
    }
}
document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-item-dropdown")) {
        document.querySelectorAll(".nav-dropdown-menu").forEach((menu) => {
            menu.classList.remove("show");
        });
    }
    if (!event.target.closest(".profile-item-dropup")) {
        document.querySelectorAll(".profile-dropup-menu").forEach((menu) => {
            menu.classList.remove("show");
        });
    }
});
