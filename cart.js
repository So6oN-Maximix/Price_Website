const testBtn = document.getElementById("test");
const cartProducts = document.getElementById("cart-list");
const nbrProductsSpan = document.getElementById("nbr-articles");
const allProductPriceSpan = document.getElementById("all-product-price");
const deliveryPriceSpan = document.getElementById("delivery-price");
const totalPriceSpan = document.getElementById("total-price");

let cartProductsList;

async function loadCart() {
    const serverResponse = await fetch("/api/loadCart");
    if (serverResponse.ok) {
        cartProductsList = await serverResponse.json();
        const nbrProducts = cartProductsList.length;
        nbrProductsSpan.textContent = nbrProducts;
        let totalProductsPrice = 0;
        cartProductsList.forEach(product => {
            addToCart(product);
            totalProductsPrice += Number(product.price);
        });
        allProductPriceSpan.textContent = totalProductsPrice;
        const deliveryPrice = (totalProductsPrice * 0.15).toFixed(2)
        deliveryPriceSpan.textContent = deliveryPrice;
        totalPriceSpan.textContent = totalProductsPrice + deliveryPrice;
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
    suppBtn.id = `supp-btn-${productName}`;
    suppBtn.textContent = "Supprimer";

    const productQuantity = document.createElement("div");
    productQuantity.classList.add("item-quantity");
    const minusBtn = document.createElement("button");
    minusBtn.classList.add("qty-btn");
    minusBtn.textContent = "-";
    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.value = "1";
    inputElement.readOnly = true;
    const plusBtn = document.createElement("button");
    plusBtn.classList.add("qty-btn");
    plusBtn.textContent = "+";

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

    const getSuppBtn = document.getElementById(`supp-btn-${productName}`);
    getSuppBtn.addEventListener("click", async () => {
        await fetch("/api/delete-from-cart", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({product_name: productName})
        });
    });
}

window.addEventListener("DOMContentLoaded", loadCart);