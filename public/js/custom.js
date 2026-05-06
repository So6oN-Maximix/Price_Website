const tabButtons = document.querySelectorAll(".custom-tab-btn");
const optionContainers = document.querySelectorAll(".options-grid");

let selectedProducts = { bouchon: "", corps: "", habillage: "", socle: "" };

function addToOptionMenu(productObj) {
    const optionItemDiv = document.createElement("div");
    optionItemDiv.classList.add("option-item", "glass-card");
    const keyCard = productObj.name === "∅" ? null : productObj.product_id;
    optionItemDiv.id = `${productObj.type}-${keyCard}-card`;

    if (productObj.name === "∅") {
        const emptyIcon = document.createElement("div");
        emptyIcon.classList.add("product-thumbnail", "empty-icon");
        emptyIcon.textContent = "∅";
        optionItemDiv.appendChild(emptyIcon);
    } else {
        const imgElement = document.createElement("img");
        imgElement.src = `https://placehold.co/100x100/transparent/white?text=${productObj.name.split(" ").join("-")}`;
        imgElement.alt = productObj.name;
        imgElement.classList.add("product-thumbnail");
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
        priceSpan.textContent = `${productObj.price}€`;
        optionItemDiv.appendChild(priceSpan);
    }

    const productType = productObj.type;
    optionItemDiv.addEventListener("click", async () => {
        if (optionItemDiv.classList.contains("selected")) return;
        selectedProducts[productType] = productObj.name === "∅" ? null : productObj.product_id;

        const parentGrid = optionItemDiv.parentElement;
        const currentlySelected = parentGrid.querySelectorAll(".selected");
        currentlySelected.forEach((element) => element.classList.remove("selected"));
        optionItemDiv.classList.add("selected");

        addToSummary(productObj);
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

function addToSummary(productObj) {
    const productType = productObj.type;
    const productTypeLine = document.getElementById(`${productType}-summary`);
    const productNameLine = document.getElementById(`summary-${productType}-name`);

    const displayName = productObj.name === "∅" ? `Aucun ${productType}` : productObj.name;

    let finalPrice = Number(productObj.price);
    if (productObj.promo) finalPrice *= 1 - Number(productObj.promo) / 100;
    const priceText = `${finalPrice.toFixed(2)}€`;

    if (!productNameLine) {
        const productNameSpan = document.createElement("span");
        productNameSpan.classList.add("item-name");
        productNameSpan.id = `summary-${productType}-name`;
        productNameSpan.textContent = productObj.name === "∅" ? `Aucun ${productType}` : productObj.name;

        const productPriceSpan = document.createElement("span");
        productPriceSpan.classList.add("item-price");
        productPriceSpan.id = `summary-${productType.toLowerCase()}-price`;
        productPriceSpan.textContent = priceText;
        productPriceSpan.dataset.price = finalPrice.toFixed(2);

        productTypeLine.appendChild(productNameSpan);
        productTypeLine.appendChild(productPriceSpan);
    } else {
        productNameLine.textContent = displayName;
        const productPriceSpan = document.getElementById(`summary-${productType}-price`);
        productPriceSpan.textContent = priceText;
        productPriceSpan.dataset.price = finalPrice.toFixed(2);
    }
}

function updateTotal() {
    let total = 0;
    const allPriceSpans = document.querySelectorAll(".item-price");
    allPriceSpans.forEach((span) => (total += Number(span.dataset.price)));
    document.getElementById("custom-total-price").textContent = `${total.toFixed(2)}€`;
}

function checkValidity() {
    const finishBtn = document.querySelector(".finish-btn");
    const selectedCount = document.querySelectorAll(".summary-details .item-price").length;
    if (selectedCount === 4) {
        finishBtn.disabled = false;
        finishBtn.style.opacity = "1";
        finishBtn.style.cursor = "pointer";
        finishBtn.textContent = "Terminer & Ajouter au panier";
    } else {
        finishBtn.disabled = true;
        finishBtn.style.opacity = "0.5";
        finishBtn.style.cursor = "not-allowed";
        finishBtn.textContent = `Sélectionne encore ${4 - selectedCount} étape(s)`;
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
                const productInfoRequest = await fetch(`/api/get-product-info?id=${value}`);
                if (productInfoRequest.ok) {
                    const productObj = await productInfoRequest.json();
                    addToSummary(productObj);
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

            saveBtn.disabled = true;
            saveBtn.textContent = "Ajout en cours...";

            for (const type in selectedProducts) {
                dataPack.custom_data[type].id = selectedProducts[type];
                if (selectedProducts[type] !== null) {
                    const productInfoRequest = await fetch(`/api/get-product-info?id=${selectedProducts[type]}`);
                    if (productInfoRequest.ok) {
                        const productObj = await productInfoRequest.json();
                        const productName = productObj.name;
                        dataPack.custom_data[type].name = productName;
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
