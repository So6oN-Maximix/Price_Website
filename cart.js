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
        const nbrProductElement = document.getElementById(`quantity-${product.name}`);
        totalProductsPrice += Number(product.price) * Number(nbrProductElement.value);
    });
    allProductPriceSpan.textContent = totalProductsPrice.toFixed(2);
    const deliveryPrice = Number((totalProductsPrice * 0.15).toFixed(2));
    deliveryPriceSpan.textContent = deliveryPrice;
    totalPriceSpan.textContent = (totalProductsPrice + deliveryPrice).toFixed(2);
}

async function loadCart() {
    const serverResponse = await fetch("/api/loadCart");
    if (serverResponse.ok) {
        cartProductsList = await serverResponse.json();
        cartProducts.innerHTML = "";
        cartProductsList.forEach(product => addToCart(product));
        loadDatas();
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
    priceDiv.textContent = productObj.price + "€";

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