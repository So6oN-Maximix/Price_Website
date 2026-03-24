const tabButtons = document.querySelectorAll(".custom-tab-btn");
const optionContainers = document.querySelectorAll(".options-grid");

function addToOptionMenu(productObj) {
    const optionItemDiv = document.createElement("div");
    optionItemDiv.classList.add("option-item", "glass-card");

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
    const optionZone = document.getElementById(`options-${productObj.type.toLowerCase()}`);
    if (optionZone) optionZone.appendChild(optionItemDiv);
}

tabButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
        tabButtons.forEach(button => button.classList.remove("active"));
        btn.classList.add("active");
        optionContainers.forEach(container => {
            container.style.display = "none";
        });
        const cible = btn.getAttribute("data-target");
        const zoneAAfficher = document.getElementById(`options-${cible}`);
        if (zoneAAfficher) {
            zoneAAfficher.style.display = "grid";
            const serverResponse = await fetch(`/api/get-product-type?productType=${cible}`);
            if (serverResponse.ok) {
                zoneAAfficher.innerHTML = "";
                const productTypeList = await serverResponse.json();
                for (const productType of productTypeList) {
                    addToOptionMenu(productType);
                }
            }
        }
    });
});
document.querySelector(".custom-tab-btn.active").click();