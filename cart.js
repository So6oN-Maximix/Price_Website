const testBtn = document.getElementById("test");
const cartProducts = document.getElementById("cart-list");

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
}

testBtn.addEventListener("click", () => addToCart({
    name: "Product 04",
    price: 12,
    color: "Metal Purple"
}));