const productContainer = document.getElementById("products-grid");
const testBtn = document.getElementById("test");
const filtersContainer = document.querySelector(".filter-group");
const checkboxs = document.querySelectorAll(".filter-group input[type='checkbox']");
const priceRange = document.getElementById("price-range");
const priceDisplay = document.getElementById("price-display");
const applyFilterBtn = document.getElementById("apply-filters-btn");

const products = [{
    name: "Produit 01",
    type: "Corps",
    price: 29.56,
    promo: 10
},
{
    name: "Produit 02",
    type: "Bouchon",
    price: 80.49,
    promo: 20
},
{
    name: "Produit 03",
    type: "Socle",
    price: 27.96
},
{
    name: "Produit 04",
    type: "Habillage",
    price: 21.02
},
{
    name: "Produit 05",
    type: "Habillage",
    price: 54.04
},
{
    name: "Produit 06",
    type: "Corps",
    price: 72.30
},
{
    name: "Produit 07",
    type: "Bouchon",
    price: 25.28,
    promo: 50
}];

function addProduct(productObj) {
    const globalCard = document.createElement("div");
    globalCard.classList.add("product-card", "glass-card");

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

    let priceElement;
    let promoBadge;
    if (productObj.hasOwnProperty("promo")) {
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
        priceElement.classList.add("price");
        priceElement.textContent = productObj.price + "€";
    }

    const buttonsDiv = document.createElement("div");
    buttonsDiv.classList.add("product-actions");
    const btnAdd = document.createElement("button");
    btnAdd.classList.add("btn-add");
    btnAdd.textContent = "Ajouter au panier";
    const btnCustom = document.createElement("button");
    btnCustom.classList.add("btn-custom");
    btnCustom.textContent = "Personnaliser";
    buttonsDiv.appendChild(btnAdd);
    buttonsDiv.appendChild(btnCustom);

    productCard.appendChild(productName);
    productCard.appendChild(priceElement);
    productCard.appendChild(buttonsDiv);

    globalCard.appendChild(categoryBadge);
    if (promoBadge) globalCard.appendChild(promoBadge);
    globalCard.appendChild(imgDiv);
    globalCard.appendChild(productCard);

    productContainer.appendChild(globalCard);
}

function getFilters() {
    let filters = [];
    checkboxs.forEach(checkbox => {if(checkbox.checked) filters.push(checkbox.value);});
    return filters;
}

window.addEventListener("DOMContentLoaded", () => products.forEach(product => addProduct(product)));
applyFilterBtn.addEventListener("click", () => {
    const filters = getFilters();
    productContainer.innerHTML = "";
    if (filters.length > 0) {
        products.forEach(product => {
            if (filters.includes(product.type.toLowerCase()) && product.price <= Number(priceRange.value)) addProduct(product);
        });
    } else {
        products.forEach(product => {if (product.price <= Number(priceRange.value)) addProduct(product);});
    }
});
priceRange.addEventListener("input", (event) => {
    priceDisplay.value = priceRange.value;
});
priceDisplay.addEventListener("input", () => {
    const priceValue = Number(priceDisplay.value);
    if (priceValue > 100) {
        priceValue = 100;
    } else if (priceValue < 0) {
        priceValue = 0;
    }
    priceRange.value = priceValue;
    priceDisplay.value = priceValue;
})