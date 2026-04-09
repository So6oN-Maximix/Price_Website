const tabButtons = document.querySelectorAll(".custom-tab-btn");
const optionContainers = document.querySelectorAll(".options-grid");

let selectedProducts = {"Bouchon": "", "Corps": "", "Habillage": "", "Socle": ""};

function addToOptionMenu(productObj) {
    const optionItemDiv = document.createElement("div");
    optionItemDiv.classList.add("option-item", "glass-card");
    optionItemDiv.id = `${productObj.name}-card`;

    const imgElement = document.createElement("img");
    imgElement.src = `https://placehold.co/100x100/transparent/white?text=${productObj.name.split(" ").join("-")}`;
    imgElement.alt = productObj.name;
    imgElement.classList.add("product-thumbnail");

    const productName = document.createElement("span");
    productName.classList.add("product-name");
    productName.textContent = productObj.name;

    optionItemDiv.appendChild(imgElement);
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
        selectedProducts[productType] = productObj.product_id;

        const parentGrid = optionItemDiv.parentElement;
        const currentlySelected = parentGrid.querySelectorAll(".selected");
        currentlySelected.forEach(element => {
            element.classList.remove("selected");
        });
        optionItemDiv.classList.add("selected");

        addToSummary(productObj);
        await fetch("/api/update-custom", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({product_list: selectedProducts})
        });
        updateTotal();
        checkValidity();
        console.log(selectedProducts);
    });

    const optionZone = document.getElementById(`options-${productType.toLowerCase()}`);
    if (optionZone) optionZone.appendChild(optionItemDiv);
}

function addToSummary(productObj) {
    const productType = productObj.type;
    const productTypeLine = document.getElementById(`${productType.toLowerCase()}-summary`);
    const productNameLine = document.getElementById(`summary-${productType.toLowerCase()}-name`)
    if (!productNameLine) {
        const productNameSpan = document.createElement("span");
        productNameSpan.classList.add("item-name");
        productNameSpan.id = `summary-${productType.toLowerCase()}-name`;
        productNameSpan.textContent = productObj.name;
        const productPriceSpan = document.createElement("span");
        productPriceSpan.classList.add("item-price");
        productPriceSpan.id = `summary-${productType.toLowerCase()}-price`;
        let productPrice = Number(productObj.price);
        if (productObj.promo) productPrice *= 1 - Number(productObj.promo) / 100;
        productPriceSpan.textContent = `${productPrice.toFixed(2)}€`;
        productPriceSpan.dataset.price = productPrice.toFixed(2);

        productTypeLine.appendChild(productNameSpan);
        productTypeLine.appendChild(productPriceSpan);
    } else {
        const productPriceSpan = document.getElementById(`summary-${productType.toLowerCase()}-price`);
        productNameLine.textContent = productObj.name;
        let productPrice = Number(productObj.price);
        if (productObj.promo) productPrice *= 1 - Number(productObj.promo) / 100;
        productPriceSpan.textContent = `${productPrice.toFixed(2)}€`;
        productPriceSpan.dataset.price = productPrice.toFixed(2);
    }
}

function updateTotal() {
    let total = 0;
    const allPriceSpans = document.querySelectorAll(".item-price");
    allPriceSpans.forEach(span => {
        total += Number(span.dataset.price); 
    });
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

checkValidity();
tabButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
        tabButtons.forEach(button => button.classList.remove("active"));
        btn.classList.add("active");
        optionContainers.forEach(container => {
            container.style.display = "none";
        });
        const cible = btn.getAttribute("data-target");
        const zoneToLoad = document.getElementById(`options-${cible}`);
        if (zoneToLoad) {
            zoneToLoad.style.display = "grid";
            const serverResponse = await fetch(`/api/get-product-type?productType=${cible}`);
            if (serverResponse.ok) {
                zoneToLoad.innerHTML = "";
                const productTypeList = await serverResponse.json();
                for (const productType of productTypeList) {
                    addToOptionMenu(productType);
                }
                const selectedProductQuery = await fetch(`/api/get-selected?type=${cible}`);
                if (selectedProductQuery.ok) {
                    const selectedProductName = await selectedProductQuery.json();
                    if (selectedProductName) {
                        const cardToSelect = document.getElementById(`${selectedProductName}-card`);
                        if (cardToSelect) {
                            cardToSelect.click();
                        }
                    }
                }
            }
        }
    });
});
window.addEventListener("DOMContentLoaded", async () => {
    document.querySelector(".custom-tab-btn.active").click();
    const getSelectedFetch = await fetch("/api/get-selected");
    if (getSelectedFetch.ok) {
        selectedProducts = await getSelectedFetch.json();
        for (const type in selectedProducts) {
            if (selectedProducts[type]) {
                const productNameLine = document.getElementById(`summary-${type.toLowerCase()}-name`);
                if (!productNameLine) {
                    const productInfoRequest = await fetch(`/api/get-product-info?id=${selectedProducts[type]}`);
                    if (productInfoRequest.ok) {
                        const productObj = await productInfoRequest.json();
                        addToSummary(productObj);
                    }
                }
            }
        }
        updateTotal();
        checkValidity();
    }
});