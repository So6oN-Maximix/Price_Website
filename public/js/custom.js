const tabButtons = document.querySelectorAll(".custom-tab-btn");
const optionContainers = document.querySelectorAll(".options-grid");

let selectedProducts = { bouchon: "", corps: "", habillage: "", socle: "" };

function addToOptionMenu(productObj, isUserDesign = false) {
    const optionItemDiv = document.createElement("div");
    optionItemDiv.classList.add("option-item", "glass-card");
    if (isUserDesign) optionItemDiv.classList.add("is-user-design");

    const keyCard = productObj.name === "∅" ? null : isUserDesign ? productObj.creation_id : productObj.product_id;
    const idPrefix = isUserDesign ? "creation_" : "";
    optionItemDiv.id = `${productObj.type}-${idPrefix}${keyCard}-card`;

    if (isUserDesign) {
        const creatorBadge = document.createElement("div");
        creatorBadge.classList.add("creator-badge-mini");
        creatorBadge.textContent = "Design";
        optionItemDiv.appendChild(creatorBadge);
    }

    if (productObj.name === "∅") {
        const emptyIcon = document.createElement("div");
        emptyIcon.classList.add("product-thumbnail", "empty-icon");
        emptyIcon.textContent = "∅";
        optionItemDiv.appendChild(emptyIcon);
    } else {
        const imgElement = document.createElement("img");
        const image = isUserDesign ? productObj.image_creation : productObj.image;
        imgElement.src = image;
        imgElement.alt = productObj.name;
        imgElement.classList.add("product-thumbnail");

        if (isUserDesign) {
            imgElement.style.objectFit = "contain";
            imgElement.style.backgroundImage = "url('/assets/Icones/background.png')";
            imgElement.style.backgroundSize = "cover";
            imgElement.style.backgroundPosition = "center";
            imgElement.style.borderRadius = "8px";
        }

        optionItemDiv.appendChild(imgElement);
    }

    const productName = document.createElement("span");
    productName.classList.add("product-name");
    productName.textContent = productObj.name === "∅" ? "Aucun" : productObj.name;

    optionItemDiv.appendChild(productName);

    if (productObj.promo) {
        const priceDiv = document.createElement("div");
        priceDiv.style.display = "flex";
        priceDiv.style.gap = "8px";
        priceDiv.style.alignItems = "center";
        priceDiv.style.marginTop = "5px";

        const oldPrice = document.createElement("span");
        oldPrice.style.textDecoration = "line-through";
        oldPrice.style.fontSize = "0.75rem";
        oldPrice.style.color = "rgba(255,255,255,0.4)";
        oldPrice.textContent = productObj.price;

        const newPrice = document.createElement("span");
        newPrice.style.fontWeight = "bold";
        newPrice.style.fontSize = "0.9rem";
        newPrice.textContent = (Number(productObj.price) * (1 - Number(productObj.promo) / 100)).toFixed(2);

        priceDiv.appendChild(oldPrice);
        priceDiv.appendChild(newPrice);
        optionItemDiv.appendChild(priceDiv);
    } else {
        const priceSpan = document.createElement("span");
        priceSpan.classList.add("option-price");
        priceSpan.textContent = isUserDesign ? "Création" : `${productObj.price}€`;
        optionItemDiv.appendChild(priceSpan);
    }

    const productType = productObj.type;
    optionItemDiv.addEventListener("click", async () => {
        if (optionItemDiv.classList.contains("selected")) return;
        selectedProducts[productType] =
            productObj.name === "∅"
                ? null
                : isUserDesign
                  ? `creation_${productObj.creation_id}`
                  : productObj.product_id;

        const parentGrid = optionItemDiv.parentElement;
        const currentlySelected = parentGrid.querySelectorAll(".selected");
        currentlySelected.forEach((element) => element.classList.remove("selected"));
        optionItemDiv.classList.add("selected");

        addToSummary(productObj, isUserDesign);
        await fetch("/api/update-custom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_list: selectedProducts })
        });
        updateTotal();
        checkValidity();
        if (typeof window.update3DModel === "function") {
            window.update3DModel(productType, selectedProducts[productType]);
        }
    });

    const optionZone = document.getElementById(`options-${productType}`);
    if (optionZone) optionZone.appendChild(optionItemDiv);
}

function addToSummary(productObj, isUserDesign = false) {
    const productType = productObj.type;
    const productTypeLine = document.getElementById(`${productType}-summary`);
    const productNameLine = document.getElementById(`summary-${productType}-name`);

    const displayName = productObj.name === "∅" ? `Aucun ${productType}` : productObj.name;

    const finalPrice = isUserDesign
        ? "Création"
        : productObj.promo
          ? (Number(productObj.price) * (1 - Number(productObj.promo) / 100)).toFixed(2)
          : Number(productObj.price).toFixed(2);
    const priceText = isUserDesign ? finalPrice : `${finalPrice}€`;

    if (!productNameLine) {
        const productNameSpan = document.createElement("span");
        productNameSpan.classList.add("item-name");
        productNameSpan.id = `summary-${productType}-name`;
        productNameSpan.textContent = productObj.name === "∅" ? `Aucun ${productType}` : productObj.name;

        const productPriceSpan = document.createElement("span");
        productPriceSpan.classList.add("item-price");
        productPriceSpan.id = `summary-${productType.toLowerCase()}-price`;
        productPriceSpan.textContent = priceText;
        productPriceSpan.dataset.price = finalPrice;

        productTypeLine.appendChild(productNameSpan);
        productTypeLine.appendChild(productPriceSpan);
    } else {
        productNameLine.textContent = displayName;
        const productPriceSpan = document.getElementById(`summary-${productType}-price`);
        productPriceSpan.textContent = priceText;
        productPriceSpan.dataset.price = finalPrice;
    }
}

function updateTotal() {
    let total = 0;
    let isUserDesign = false;
    const allPriceSpans = document.querySelectorAll(".item-price");
    for (let i = 0; i < allPriceSpans.length; i++) {
        if (allPriceSpans[i].dataset.price === "Création") {
            total = "Création";
            isUserDesign = true;
            break;
        } else {
            total += Number(allPriceSpans[i].dataset.price);
        }
    }
    if (!isUserDesign) total = total.toFixed(2);
    document.getElementById("custom-total-price").textContent = isUserDesign ? total : `${total}€`;
}

function checkValidity() {
    let isUserDesign = false;
    const allPriceSpans = document.querySelectorAll(".item-price");
    allPriceSpans.forEach((span) => {
        if (span.dataset.price === "Création") isUserDesign = true;
    });

    if (isUserDesign) {
        document.querySelector(".finish-btn").textContent = "Enregistrer la Création";
    } else {
        document.querySelector(".finish-btn").textContent = "Terminer & Ajouter au panier";
    }
}

function showToast() {
    let toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.classList.add("toast-container");
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        Personnalisation ajouté au panier !
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove());
    }, 3000);
}

async function resetCustom() {
    await fetch("/api/clear-custom", { method: "POST" });
    for (const type in selectedProducts) {
        selectedProducts[type] = null;
        addToSummary({
            name: "∅",
            type: type,
            price: 0.0,
            promo: null
        });
        if (typeof window.update3DModel === "function") {
            window.update3DModel(type, null);
        }
        const optionZone = document.getElementById(`options-${type}`);
        if (optionZone) {
            const currentlySelected = optionZone.querySelectorAll(".selected");
            currentlySelected.forEach((elem) => elem.classList.remove("selected"));

            const nullCard = document.getElementById(`${type}-null-card`);
            if (nullCard) nullCard.classList.add("selected");
        }
    }
    updateTotal();
    checkValidity();
}

checkValidity();
tabButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
        tabButtons.forEach((button) => button.classList.remove("active"));
        btn.classList.add("active");
        optionContainers.forEach((container) => (container.style.display = "none"));
        const cible = btn.getAttribute("data-target");
        const zoneToLoad = document.getElementById(`options-${cible}`);
        if (zoneToLoad) {
            zoneToLoad.style.display = "grid";
            if (zoneToLoad.innerHTML.trim() === "") {
                const serverResponse = await fetch(`/api/get-product-type?productType=${cible}`);
                if (serverResponse.ok) {
                    zoneToLoad.innerHTML = "";
                    addToOptionMenu({
                        name: "∅",
                        type: cible,
                        price: 0.0,
                        promo: null
                    });
                    const productTypeList = await serverResponse.json();
                    for (const productType of productTypeList) {
                        addToOptionMenu(productType);
                    }
                }
                const creationResponse = await fetch(`/api/get-creation-type?productType=${cible}`);
                if (creationResponse.ok) {
                    const creationList = await creationResponse.json();
                    for (const creation of creationList) {
                        addToOptionMenu(creation, true);
                    }
                }
            }
            const selectedProductId = selectedProducts[cible];
            const currentlySelected = zoneToLoad.querySelectorAll(".selected");
            currentlySelected.forEach((elem) => elem.classList.remove("selected"));

            let cardIdToSelect = `${cible}-${selectedProductId}-card`;
            if (selectedProductId === null || selectedProductId === undefined) cardIdToSelect = `${cible}-null-card`;

            const cardToSelct = document.getElementById(cardIdToSelect);
            if (cardToSelct) cardToSelct.classList.add("selected");
        }
    });
});

window.addEventListener("DOMContentLoaded", async () => {
    document.querySelector(".custom-tab-btn.active").click();
    const getSelectedFetch = await fetch("/api/get-selected");
    if (getSelectedFetch.ok) {
        const databaseProducts = await getSelectedFetch.json();
        for (const type in selectedProducts) {
            let value = databaseProducts[type];
            if (value === undefined || value === "") value = null;
            selectedProducts[type] = value;
            if (value === null) {
                addToSummary({
                    name: "∅",
                    type: type,
                    price: 0.0,
                    promo: null
                });
            } else {
                const isCreation = String(value).startsWith("creation_");
                const productInfoRequestQuery = isCreation
                    ? `/api/get-creation-info?id=${String(value).replace("creation_", "")}`
                    : `/api/get-product-info?id=${value}`;
                const productInfoRequest = await fetch(productInfoRequestQuery);
                if (productInfoRequest.ok) {
                    const productObj = await productInfoRequest.json();
                    addToSummary(productObj, isCreation);
                }
            }
        }
        updateTotal();
        checkValidity();
        await loadAnimation(selectedProducts);

        const firstActiveTab = document.querySelector(".custom-tab-btn.active");
        if (firstActiveTab) firstActiveTab.click();
    }
});

document.addEventListener("click", (event) => {
    const sidebar = document.querySelector(".custom-sidebar");
    const summary = document.querySelector(".custom-summary");
    const triggerBar = document.querySelector(".mobile-trigger-bar");
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(event.target) && !summary.contains(event.target) && !triggerBar.contains(event.target)) {
            sidebar.classList.remove("active");
            summary.classList.remove("active");
        }
    }
});

const finishButton = document.getElementById("finish-button");
finishButton.addEventListener("click", () => {
    if (finishButton.disabled) return;
    document.querySelector(".custom-summary").classList.remove("active");
    const finishCustomContainer = document.getElementById("finish-custom-modal");
    finishCustomContainer.classList.add("show");
    document.body.style.overflow = "hidden";
    const closeCustomButton = document.getElementById("close-finish-modal-btn");
    closeCustomButton.addEventListener("click", () => {
        finishCustomContainer.classList.remove("show");
        document.body.style.overflow = "auto";
    });
    window.addEventListener("click", (event) => {
        if (event.target === finishCustomContainer) {
            finishCustomContainer.classList.remove("show");
            document.body.style.overflow = "auto";
        }
    });

    for (const type in selectedProducts) {
        const productLineNameFinish = document.getElementById(`choix-${type}`);
        const productLinePriceFinish = document.getElementById(`recap-${type}`);
        const summaryProductName = document.getElementById(`summary-${type}-name`).textContent;
        const summaryProductPrice = document.getElementById(`summary-${type}-price`).textContent;
        productLineNameFinish.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} : ${summaryProductName}`;
        productLinePriceFinish.textContent = summaryProductPrice;
    }
    document.getElementById("recap-prix").textContent = document.getElementById("custom-total-price").textContent;

    const saveBtn = document.getElementById("save-custom-btn");
    saveBtn.onclick = async () => {
        const customName = document.getElementById("custom-design-name").value;
        console.log(`${customName} enregistré !`);
        finishCustomContainer.classList.remove("show");
        finishButton.disabled = true;
        const originalText = finishButton.textContent;
        finishButton.textContent = "Ajout...";
        finishButton.classList.add("loading");
        try {
            const dataPack = {
                is_custom: "true",
                custom_name: customName,
                custom_price: Number(document.getElementById("recap-prix").textContent.slice(0, -1)).toFixed(2),
                custom_data: {
                    bouchon: {
                        id: 0,
                        name: ""
                    },
                    corps: {
                        id: 0,
                        name: ""
                    },
                    habillage: {
                        id: 0,
                        name: ""
                    },
                    socle: {
                        id: 0,
                        name: ""
                    }
                }
            };

            for (const type in selectedProducts) {
                dataPack.custom_data[type].id = selectedProducts[type];
                if (selectedProducts[type] !== null) {
                    const isCreation = String(selectedProducts[type]).startsWith("creation_");
                    const fetchUrl = isCreation
                        ? `/api/get-creation-info?id=${String(selectedProducts[type]).replace("creation_", "")}`
                        : `/api/get-product-info?id=${selectedProducts[type]}`;

                    const productInfoRequest = await fetch(fetchUrl);
                    if (productInfoRequest.ok) {
                        const productObj = await productInfoRequest.json();
                        dataPack.custom_data[type].name = productObj.name;
                    }
                }
            }
            const response = await fetch("/api/add-custom-to-cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data_pack: dataPack })
            });
            if (!response.ok) {
                finishButton.textContent = "Erreur (Non connecté ?)";
                finishButton.classList.remove("loading");
            }

            finishButton.textContent = "Ajouté ! ✓";
            finishButton.classList.remove("loading");
            finishButton.classList.add("success");
            document.getElementById("custom-design-name").value = "";
            showToast();
            await resetCustom();
        } catch (error) {
            console.log(error);
            finishButton.textContent = "Erreur";
            finishButton.classList.remove("loading");
        }
        setTimeout(() => {
            finishButton.textContent = originalText;
            finishButton.classList.remove("success");
            finishButton.disabled = false;
        }, 2500);
    };
});
