const productContainer = document.getElementById("products-grid");
const checkboxs = document.querySelectorAll(".filter-group input[type='checkbox']");
const priceRange = document.getElementById("price-range");
const priceDisplay = document.getElementById("price-display");
const applyFilterBtn = document.getElementById("apply-filters-btn");

let products;
let addToCartBtnList = [];

async function loadProducts() {
    const serverResponse = await fetch("/api/load-datas");
    if (serverResponse.ok) {
        products = await serverResponse.json();
        products.forEach((product) => addProduct(product));
    }
}

function addProduct(productObj) {
    const globalCard = document.createElement("div");
    globalCard.classList.add("product-card", "glass-card");
    globalCard.style.cursor = "pointer";

    const categoryBadge = document.createElement("div");
    categoryBadge.classList.add("badge-category");
    categoryBadge.textContent = productObj.type.charAt(0).toUpperCase() + productObj.type.slice(1);

    const imgDiv = document.createElement("div");
    imgDiv.classList.add("product-img");
    const image = document.createElement("img");
    image.src = productObj.image;
    image.alt = productObj.name;
    imgDiv.appendChild(image);

    const productCard = document.createElement("div");
    productCard.classList.add("product-info");
    const productName = document.createElement("h4");
    productName.textContent = productObj.name;

    let priceElement;
    let promoBadge;
    if (productObj.promo) {
        priceElement = document.createElement("div");
        priceElement.classList.add("price-container");
        const priceSpan = document.createElement("span");
        priceSpan.classList.add("old-price");
        priceSpan.textContent = productObj.price + "€";
        const pricePromoSpan = document.createElement("span");
        pricePromoSpan.classList.add("price");
        pricePromoSpan.textContent = `${(productObj.price * (1 - productObj.promo / 100)).toFixed(2)}€`;
        priceElement.appendChild(priceSpan);
        priceElement.appendChild(document.createTextNode(" "));
        priceElement.appendChild(pricePromoSpan);

        promoBadge = document.createElement("div");
        promoBadge.classList.add("badge-promo");
        promoBadge.textContent = `-${productObj.promo}%`;
    } else {
        priceElement = document.createElement("span");
        priceElement.classList.add("price");
        priceElement.textContent = productObj.price + "€";
    }

    const buttonsDiv = document.createElement("div");
    buttonsDiv.classList.add("product-actions");
    const btnAdd = document.createElement("button");
    btnAdd.classList.add("btn-add");
    btnAdd.id = "btn-add-" + productObj.name;
    btnAdd.textContent = "Ajouter au panier";
    const btnCustom = document.createElement("button");
    btnCustom.classList.add("btn-custom");
    btnCustom.id = "btn-custom-" + productObj.name;
    btnCustom.textContent = "Personnaliser";
    btnCustom.addEventListener("click", async () => {
        if (btnCustom.disabled) return;
        btnCustom.disabled = true;
        const originalText = btnCustom.textContent;
        btnCustom.textContent = "Ajout...";
        btnCustom.classList.add("loading");
        const productName = btnCustom.id.replace("btn-custom-", "");
        try {
            const response = await fetch("/api/add-to-custom", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(productObj)
            });
            if (response.ok) {
                btnCustom.textContent = "Ajouté ! ✓";
                btnCustom.classList.remove("loading");
                btnCustom.classList.add("success");
                window.location.href = "/custom";
                showToast(`${productName} ajouté au Custom !`);
            } else {
                btnCustom.textContent = "Erreur (Non connecté ?)";
                btnCustom.classList.remove("loading");
            }
        } catch {
            btnCustom.textContent = "Erreur";
            btnCustom.classList.remove("loading");
        }
        setTimeout(() => {
            btnCustom.textContent = originalText;
            btnCustom.classList.remove("success");
            btnCustom.disabled = false;
        }, 2500);
    });
    buttonsDiv.appendChild(btnAdd);
    buttonsDiv.appendChild(btnCustom);

    const colorDiv = document.createElement("div");
    colorDiv.classList.add("product-colors");
    const colorList = productObj.colors;
    if (colorList) {
        for (const color of colorList) {
            const colorElement = document.createElement("div");
            colorElement.classList.add("color-dot");
            colorElement.style.backgroundColor = color;
            colorDiv.appendChild(colorElement);
        }
    }
    const infoHeader = document.createElement("div");
    infoHeader.classList.add("product-info-header");
    infoHeader.style.alignItems = "center";
    infoHeader.style.marginTop = "10px";
    infoHeader.appendChild(priceElement);
    infoHeader.appendChild(colorDiv);

    productCard.appendChild(productName);
    productCard.appendChild(infoHeader);
    productCard.appendChild(buttonsDiv);

    globalCard.appendChild(categoryBadge);
    if (promoBadge) globalCard.appendChild(promoBadge);
    globalCard.appendChild(imgDiv);
    globalCard.appendChild(productCard);
    globalCard.addEventListener("click", (event) => {
        const isButtonClick = event.target.tagName === "BUTTON";
        const isColorClick = event.target.classList.contains("color-dot");
        if (isButtonClick || isColorClick) {
            return;
        }
        window.location.href = `/product?id=${productObj.product_id}`;
    });

    productContainer.appendChild(globalCard);

    addToCartBtnList.push(document.getElementById(`btn-add-${productObj.name}`));
}

function getFilters() {
    let filters = [];
    checkboxs.forEach((checkbox) => {
        if (checkbox.checked) filters.push(checkbox.value);
    });
    return filters;
}

function showToast(message) {
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
        ${message}
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove());
    }, 3000);
}

window.addEventListener("DOMContentLoaded", async () => {
    await loadProducts();
    addToCartBtnList.forEach((btn) => {
        btn.addEventListener("click", async () => {
            if (btn.disabled) return;
            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = "Ajout...";
            btn.classList.add("loading");
            const productName = btn.id.replace("btn-add-", "");
            try {
                const response = await fetch("/api/add-product-to-cart", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ product_name: productName })
                });
                if (response.ok) {
                    btn.textContent = "Ajouté ! ✓";
                    btn.classList.remove("loading");
                    btn.classList.add("success");
                    showToast(`${productName} ajouté au panier !`);
                } else {
                    btn.textContent = "Erreur (Non connecté ?)";
                    btn.classList.remove("loading");
                }
            } catch {
                btn.textContent = "Erreur";
                btn.classList.remove("loading");
            }
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove("success");
                btn.disabled = false;
            }, 2500);
        });
    });
});
applyFilterBtn.addEventListener("click", () => {
    const filters = getFilters();
    productContainer.innerHTML = "";
    if (filters.length > 0) {
        products.forEach((product) => {
            if (filters.includes(product.type.toLowerCase()) && product.price <= Number(priceRange.value))
                addProduct(product);
        });
    } else {
        products.forEach((product) => {
            if (product.price <= Number(priceRange.value)) addProduct(product);
        });
    }
});
priceRange.addEventListener("input", () => (priceDisplay.value = priceRange.value));
priceDisplay.addEventListener("input", () => {
    let priceValue = Number(priceDisplay.value);
    if (priceValue > 100) {
        priceValue = 100;
    } else if (priceValue < 0) {
        priceValue = 0;
    }
    priceRange.value = priceValue;
    priceDisplay.value = priceValue;
});

document.addEventListener("DOMContentLoaded", () => {
    const filterTitle = document.querySelector(".shop-sidebar h3");
    const sidebar = document.querySelector(".shop-sidebar");

    if (filterTitle && sidebar) {
        filterTitle.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle("open");
            }
        });
    }
});
