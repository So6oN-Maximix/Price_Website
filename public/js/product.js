function showToast(productName) {
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
        ${productName} ajouté au panier !
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove());
    }, 3000);
}

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    if (!productId) {
        document.getElementById("detail-name").textContent = "Produit introuvable";
        return;
    }
    try {
        const response = await fetch(`/api/get-product-info?id=${productId}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération du produit");
        const productData = await response.json();

        document.getElementById("detail-name").textContent = productData.name;
        document.getElementById("detail-category").textContent = productData.type;
        document.getElementById("detail-img").src = productData.image;
        const priceDiv = document.createElement("div");
        priceDiv.style.display = "flex";
        priceDiv.style.alignItems = "center";
        priceDiv.style.gap = "15px";
        priceDiv.style.marginTop = "10px";
        if (productData.promo) {
            const badgePromoDiv = document.createElement("div");
            badgePromoDiv.classList.add("badge-promo");
            badgePromoDiv.style.fontSize = "1.1rem";
            badgePromoDiv.style.padding = "6px 14px";
            badgePromoDiv.style.borderRadius = "20px";
            badgePromoDiv.textContent = `-${productData.promo}%`;
            document.getElementById("header-badges").appendChild(badgePromoDiv);

            const oldPriceSpan = document.createElement("span");
            oldPriceSpan.classList.add("old-price");
            oldPriceSpan.style.textDecoration = "line-through";
            oldPriceSpan.style.color = "rgba(255, 255, 255, 0.4)";
            oldPriceSpan.style.fontSize = "1.3rem";
            oldPriceSpan.textContent = `${productData.price}€`;

            const priceSpan = document.createElement("span");
            priceSpan.classList.add("price");
            priceSpan.style.fontSize = "2.2rem";
            priceSpan.style.fontWeight = "bold";
            priceSpan.textContent = `${(Number(productData.price) * (1 - Number(productData.promo) / 100)).toFixed(2)}€`;

            priceDiv.appendChild(oldPriceSpan);
            priceDiv.appendChild(priceSpan);
        } else {
            const priceSpan = document.createElement("span");
            priceSpan.classList.add("price");
            priceSpan.style.fontSize = "2.2rem";
            priceSpan.style.fontWeight = "bold";
            priceSpan.textContent = `${productData.price}€`;

            priceDiv.appendChild(priceSpan);
        }
        const priceContainer = document.getElementById("detail-price-container");
        priceContainer.appendChild(priceDiv);

        const productColorsDiv = document.createElement("div");
        productColorsDiv.classList.add("product-colors");
        productColorsDiv.id = "detail-colors";

        const productColors = productData.colors;
        for (const color of productColors) {
            const colorDiv = document.createElement("div");
            colorDiv.classList.add("color-dot");
            if (productColors.indexOf(color) === 0) colorDiv.classList.add("active");
            colorDiv.style.backgroundColor = color;
            productColorsDiv.appendChild(colorDiv);
        }

        const selectedColorSpan = document.createElement("span");
        selectedColorSpan.id = "selected-color-name";
        selectedColorSpan.classList.add("color-name-display");
        selectedColorSpan.innerHTML = `Sélectionné : <span id="selected-color">${productColors[0]}</span>`;

        document.getElementById("product-selection-group").appendChild(productColorsDiv);
        document.getElementById("product-selection-group").appendChild(selectedColorSpan);
    } catch (error) {
        console.error("Erreur complète :", error);
        document.getElementById("detail-name").textContent = "Erreur de chargement";
    }
});

const addToCartBtn = document.getElementById("detail-add-cart");
addToCartBtn.addEventListener("click", async () => {
    if (addToCartBtn.disabled) return;
    addToCartBtn.disabled = true;
    const originalText = addToCartBtn.textContent;
    addToCartBtn.textContent = "Ajout...";
    addToCartBtn.classList.add("loading");
    const productName = document.getElementById("detail-name").textContent;
    try {
        const response = await fetch("/api/add-product-to-cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_name: productName })
        });
        if (response.ok) {
            addToCartBtn.textContent = "Ajouté ! ✓";
            addToCartBtn.classList.remove("loading");
            addToCartBtn.classList.add("success");
            showToast(productName);
        } else {
            addToCartBtn.textContent = "Erreur (Non connecté ?)";
            addToCartBtn.classList.remove("loading");
        }
    } catch (error) {
        console.log(error);
        addToCartBtn.textContent = "Erreur";
        addToCartBtn.classList.remove("loading");
    }
    setTimeout(() => {
        addToCartBtn.textContent = originalText;
        addToCartBtn.classList.remove("success");
        addToCartBtn.disabled = false;
    }, 2500);
});
