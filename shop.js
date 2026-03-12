const productContainer = document.getElementById("shop-container");
const testBtn = document.getElementById("test");
const products = [{
    name: "Produit 01",
    type: "Corps",
    price: "29.56"
},
{
    name: "Produit 02",
    type: "Bouchon",
    price: "80.49",
    promo: 20
},
{
    name: "Produit 03",
    type: "Socle",
    price: "27.96"
},
{
    name: "Produit 04",
    type: "Habillage",
    price: "21.02"
},
{
    name: "Produit 05",
    type: "Habillage",
    price: "54.04"
},
{
    name: "Produit 06",
    type: "Corps",
    price: "72.30"
},
{
    name: "Produit 07",
    type: "Bouchon",
    price: "25.28",
    promo: 50
}];

function addProduct(productObj) {
    const globalCard = document.createElement("div");
    globalCard.classList.add("product-card glass-card");

    const categoryBadge = document.createElement("div");
    categoryBadge.classList.add("badge-category");
    categoryBadge.textContent = productObj.type;

    const imgDiv = document.createElement("div");
    imgDiv.classList.add("product-img");
    const image = document.createElement("img");
    image.src = "https://via.placeholder.com/200";  // A CHANGER AVEC LA BONNE IMAGE
    image.alt = "Produit";                          // A CHANGER AVEC LA BONNE IMAGE
    imgDiv.appendChild(image);

    const productCard = document.createElement("div");
    productCard.classList.add("product-info");
    const productName = document.createElement("h4");
    productName.textContent = productObj.name;
    const priceSpan = document.createElement("span");
    priceSpan.classList.add("price");
    priceSpan.textContent = productObj.price;
    const buttonsDiv = document.createElement("div");
    buttonsDiv.classList.add("product-actions");
    const btnAdd = document.createElement("button");
    btnAdd.classList.add = "btn-add";
    btnAdd.textContent = "Ajouter au panier";
    const btnCustom = document.createElement("button");
    btnCustom.classList.add("btn-custom");
    btnCustom.textContent = "Personnaliser";
    buttonsDiv.appendChild(btnAdd);
    buttonsDiv.appendChild(btnCustom);

    productCard.appendChild(productName);
    productCard.appendChild(priceSpan);
    productCard.appendChild(buttonsDiv);

    globalCard.appendChild(categoryBadge);
    globalCard.appendChild(imgDiv);
    globalCard.appendChild(productCard);

    productContainer.appendChild(globalCard);
}

testBtn.addEventListener("click", () => addProduct({
    name: "Product 03",
    type: "Socle",
    price: "13.67"
}));