const testBtn = document.getElementById("test");
const cartProducts = document.getElementById("cart-list");
const nbrProductsSpan = document.getElementById("nbr-articles");
const allProductPriceSpan = document.getElementById("all-product-price");
const deliveryPriceSpan = document.getElementById("delivery-price");
const totalPriceSpan = document.getElementById("total-price");
const articleText = document.getElementById("article");

const paiementBtn = document.getElementById("paiement-btn");

let cartProductsList;

function loadDatas() {
    const nbrItems = cartProductsList.length;
    nbrProductsSpan.textContent = nbrItems;
    if (nbrItems > 1) {
        articleText.textContent = "articles";
    } else {
        articleText.textContent = "article";
    }
    let totalProductsPrice = 0;
    cartProductsList.forEach(product => {
        if (product.is_custom) {
            totalProductsPrice += Number(product.custom_price) * Number(product.nbr_item || 1);
        } 
        else {
            const nbrProductElement = document.getElementById(`quantity-${product.name}`);
            const qty = nbrProductElement ? Number(nbrProductElement.value) : Number(product.nbr_item);
            const productPromo = product.promo ? 1 - Number(product.promo)/100 : 1;
            totalProductsPrice += Number(product.price * productPromo) * qty;
        }
    });
    allProductPriceSpan.textContent = totalProductsPrice.toFixed(2);
    const deliveryPrice = Number((totalProductsPrice * 0.15).toFixed(2));
    deliveryPriceSpan.textContent = deliveryPrice;
    totalPriceSpan.textContent = (totalProductsPrice + deliveryPrice).toFixed(2);
}

async function loadCart() {
    const serverResponse = await fetch("/api/loadCart");
    if (serverResponse.ok) {
        const response = await serverResponse.json();
        cartProductsList = response;
        cartProducts.innerHTML = "";
        cartProductsList.forEach(product => {
            if (product.is_custom) {
                addCustomToCart(product);
            } else {
                addToCart(product);
            }
        });
        loadDatas();
        initPackToggles();
    }
}

function addToCart(productObj) {
    const globalCard = document.createElement("div");
    globalCard.classList.add("cart-item", "glass-card");

    const imgDiv = document.createElement("div");
    imgDiv.classList.add("item-img");
    const imageProduct = document.createElement("img");
    imageProduct.src = "https://via.placeholder.com/100";   // A CHANGER
    imageProduct.alt = "Produit";                           // A CHANGER

    const productDetails = document.createElement("div");
    productDetails.classList.add("item-details");
    const productName = document.createElement("h3");
    productName.textContent = productObj.name;
    const productColor = document.createElement("p");
    productColor.classList.add("item-variant");
    productColor.textContent = productObj.color;
    const suppBtn = document.createElement("button");
    suppBtn.classList.add("remove-btn");
    suppBtn.textContent = "Supprimer";

    suppBtn.addEventListener("click", async () => {
        if (suppBtn.disabled) return;
        suppBtn.disabled = true;
        const originalText = suppBtn.textContent;
        suppBtn.textContent = "Suppression...";
        suppBtn.style.opacity = "0.5";
        suppBtn.style.cursor = "not-allowed";

        try {
            const reponse = await fetch("/api/delete-from-cart", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({product_id: productObj.product_id}) 
            });

            if (reponse.ok) {
                showToast(`${productObj.name} retiré !`);
                globalCard.remove();
                cartProductsList = cartProductsList.filter(product => product.name !== productObj.name);
                loadDatas();
            } else {
                suppBtn.textContent = "Erreur";
                suppBtn.style.opacity = "1";
                suppBtn.style.cursor = "pointer";
                setTimeout(() => {
                    suppBtn.disabled = false;
                    suppBtn.textContent = originalText;
                }, 2000);
            }
        } catch (error) {
            suppBtn.textContent = "Erreur";
            suppBtn.style.opacity = "1";
            suppBtn.style.cursor = "pointer";
            setTimeout(() => {
                suppBtn.disabled = false;
                suppBtn.textContent = originalText;
            }, 2000);
        }
    });

    const productQuantity = document.createElement("div");
    productQuantity.classList.add("item-quantity");
    const minusBtn = document.createElement("button");
    minusBtn.classList.add("qty-btn");
    minusBtn.textContent = "-";
    const inputElement = document.createElement("input");
    inputElement.id = `quantity-${productObj.name}`;
    inputElement.type = "text";
    inputElement.value = productObj.nbr_item || 1;
    inputElement.readOnly = true;
    const plusBtn = document.createElement("button");
    plusBtn.classList.add("qty-btn");
    plusBtn.textContent = "+";
    minusBtn.addEventListener("click", async () => {
        if (inputElement.value > 1) {
            inputElement.value = Number(inputElement.value) - 1;
            loadDatas();
            await fetch("/api/update-product-quantity", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    product_id: productObj.product_id,
                    quantity: Number(inputElement.value)
                })
            });
        }
    })
    plusBtn.addEventListener("click", async () => {
        inputElement.value = Number(inputElement.value) + 1;
        loadDatas();
        await fetch("/api/update-product-quantity", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                product_id: productObj.product_id,
                quantity: Number(inputElement.value)
            })
        });
    })

    const priceDiv = document.createElement("div");
    priceDiv.classList.add("item-price");
    priceDiv.style.display = "flex";
    priceDiv.style.flexDirection = "column";
    priceDiv.style.alignItems = "flex-end";
    priceDiv.style.gap = "2px";

    let prixFinal = Number(productObj.price);
    if (productObj.promo) {
        prixFinal = prixFinal - (prixFinal * (Number(productObj.promo) / 100));

        const ancienPrix = document.createElement("span");
        ancienPrix.textContent = `${productObj.price}€`;
        ancienPrix.style.textDecoration = "line-through";
        ancienPrix.style.color = "rgba(255, 255, 255, 0.4)";
        ancienPrix.style.fontSize = "0.85rem";

        const nouveauPrix = document.createElement("span");
        nouveauPrix.textContent = `${prixFinal.toFixed(2)}€`;
        nouveauPrix.style.fontWeight = "bold";

        priceDiv.appendChild(ancienPrix);
        priceDiv.appendChild(nouveauPrix);
    } else {
        priceDiv.textContent = `${prixFinal.toFixed(2)}€`;
    }

    imgDiv.appendChild(imageProduct);

    productDetails.appendChild(productName);
    productDetails.appendChild(productColor);
    productDetails.appendChild(suppBtn);

    productQuantity.appendChild(minusBtn);
    productQuantity.appendChild(inputElement);
    productQuantity.appendChild(plusBtn);

    globalCard.appendChild(imgDiv);
    globalCard.appendChild(productDetails);
    globalCard.appendChild(productQuantity);
    globalCard.appendChild(priceDiv);

    cartProducts.appendChild(globalCard);
}

function addCustomToCart(dataPack) {
    const globalCustomCard = document.createElement("div");
    globalCustomCard.classList.add("cart-item", "custom-pack-item", "glass-card");

    /* --- MAIN ROW -- */
    const mainRowCard = document.createElement("div");
    mainRowCard.classList.add("pack-main-row");

    /* IMAGE */
    const imgCustomDiv = document.createElement("div");
    imgCustomDiv.classList.add("pack-img-mini");
    const imgCustomElement = document.createElement("img");
    imgCustomElement.src = "https://placehold.co/80x80/transparent/white?text=Gourde";   // A CHANGER
    imgCustomElement.alt = "Création";                                                   // A CHANGER

    imgCustomDiv.appendChild(imgCustomElement);

    /* INFO PACK */
    const customInfo = document.createElement("div");
    customInfo.classList.add("pack-info-compact");
    const customBadge = document.createElement("span");
    customBadge.classList.add("custom-badge");
    customBadge.textContent = "✨ Création";
    const customNameTitle = document.createElement("h3");
    customNameTitle.textContent = dataPack.custom_name;

    customInfo.appendChild(customBadge);
    customInfo.appendChild(customNameTitle);

    /* ACTIONS */
    const customActions = document.createElement("div");
    customActions.classList.add("pack-actions-compact");
    const quantityDiv = document.createElement("div");
    quantityDiv.classList.add("item-quantity");
    const minusBtn = document.createElement("button");
    minusBtn.classList.add("qty-btn");
    minusBtn.textContent = "-";
    const quantityInput = document.createElement("input");
    quantityInput.type = "text";
    quantityInput.value = "1";
    quantityInput.readOnly = true;
    const plusBtn = document.createElement("button");
    plusBtn.classList.add("qty-btn");
    plusBtn.textContent = "+";

    quantityDiv.appendChild(minusBtn);
    quantityDiv.appendChild(quantityInput);
    quantityDiv.appendChild(plusBtn);

    const priceDiv = document.createElement("div");
    priceDiv.classList.add("item-price");
    priceDiv.style.color = "#4ade80";
    priceDiv.textContent = `${dataPack.custom_price}€`;

    const removeBtn = document.createElement("button");
    removeBtn.classList.add("remove-btn", "delete-btn");
    removeBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    `;

    const toggleBtn = document.createElement("button");
    toggleBtn.classList.add("toggle-details-btn");
    toggleBtn.ariaLabel = "Voir les détails";
    toggleBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    `;

    customActions.appendChild(quantityDiv);
    customActions.appendChild(priceDiv);
    customActions.appendChild(removeBtn);
    customActions.appendChild(toggleBtn);

    /* ASSEMBLY */
    mainRowCard.appendChild(imgCustomDiv);
    mainRowCard.appendChild(customInfo);
    mainRowCard.appendChild(customActions);

    /* --- DETAILS --- */
    const packDetails = document.createElement("div");
    packDetails.classList.add("pack-details-collapse");

    const partList = document.createElement("ul");
    partList.classList.add("pack-parts-list");
    const liBouchon = document.createElement("li");
    liBouchon.innerHTML = `<b>Bouchon:</b> ${dataPack.custom_data.bouchon.name}`;
    const liCorps = document.createElement("li");
    liCorps.innerHTML = `<b>Corps:</b> ${dataPack.custom_data.corps.name}`;
    const liHabillage = document.createElement("li");
    liHabillage.innerHTML = `<b>Habillage:</b> ${dataPack.custom_data.habillage.name}`;
    const liSocle = document.createElement("li");
    liSocle.innerHTML = `<b>Socle:</b> ${dataPack.custom_data.socle.name}`;

    partList.appendChild(liBouchon);
    partList.appendChild(liCorps);
    partList.appendChild(liHabillage);
    partList.appendChild(liSocle);

    packDetails.appendChild(partList);

    /* --- GLOBAL ASSEMBLY --- */
    globalCustomCard.appendChild(mainRowCard);
    globalCustomCard.appendChild(packDetails);

    cartProducts.appendChild(globalCustomCard);
}

function showToast(message) {
    let toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.classList.add("toast-container");
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.classList.add("toast", "remove");
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

window.addEventListener("DOMContentLoaded", loadCart);
paiementBtn.addEventListener("click", async () => {
    await fetch("/api/procede-paiement", {method: "POST"});
    loadCart();
});

/* ----- TEST ----- */

// Fonction pour activer les flèches des packs custom
function initPackToggles() {
    const toggleBtns = document.querySelectorAll('.toggle-details-btn');
    
    toggleBtns.forEach(btn => {
        // Pour éviter d'ajouter l'événement plusieurs fois si on recharge le panier
        btn.removeEventListener('click', togglePack); 
        btn.addEventListener('click', togglePack);
    });
}

// Fonction qui fait l'action
function togglePack(event) {
    // On cherche la carte parent (.custom-pack-item) et on ajoute ou enlève la classe "expanded"
    const packItem = event.currentTarget.closest('.custom-pack-item');
    if (packItem) {
        packItem.classList.toggle('expanded');
    }
}

// À appeler au chargement de ta page, ou après que ton JS ait généré le HTML du panier !
document.addEventListener('DOMContentLoaded', () => {
    initPackToggles();
});