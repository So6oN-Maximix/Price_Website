import database from "../database.js";

// POST

export const addProductToCart = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
        const data = JSON.parse(body);
        const productName = data.product_name;
        try {
            const getProductQuery = await database.query("SELECT product_id FROM products WHERE name = $1", [
                productName
            ]);
            const productId = getProductQuery.rows[0].product_id;
            const isProductInCartQuery = await database.query(
                "SELECT * FROM carts WHERE product_id = $1 AND user_id = $2",
                [productId, userId]
            );
            if (isProductInCartQuery.rows.length > 0) {
                const nbtItem = isProductInCartQuery.rows[0].nbr_item;
                await database.query("UPDATE carts SET nbr_item = $1 WHERE product_id = $2 AND user_id = $3", [
                    nbtItem + 1,
                    productId,
                    userId
                ]);
            } else {
                await database.query(
                    "INSERT INTO carts(product_id, nbr_item, user_id, is_custom) VALUES ($1, 1, $2, FALSE);",
                    [productId, userId]
                );
                console.log(`Produit ${productId} ajouté dans la BDD`);
            }
            res.writeHead(200, { Location: "/shop" });
        } catch (error) {
            console.error("Erreur API - Panier Product: ", error);
            res.writeHead(500);
        }
        res.end();
    });
};

export const addCustomToCart = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
        const data = JSON.parse(body);
        const customData = data.data_pack;
        try {
            const getCustomQuery = await database.query("SELECT custom_id FROM customisation WHERE user_id = $1", [
                userId
            ]);
            const customId = getCustomQuery.rows[0].custom_id;
            await database.query(
                "INSERT INTO carts(nbr_item, user_id, is_custom, custom_name, custom_price, custom_data) VALUES (1, $1, TRUE, $2, $3, $4);",
                [userId, customData.custom_name, customData.custom_price, customData.custom_data]
            );
            await database.query(
                "INSERT INTO saved_customs(custom_name, custom_price, custom_data, user_id) VALUES ($1, $2, $3, $4);",
                [customData.custom_name, customData.custom_price, customData.custom_data, userId]
            );
            console.log(`Custom ${customId} ajouté dans la BDD`);
            res.writeHead(200, { Location: "/custom" });
        } catch (error) {
            console.error("Erreur API - Panier Custom: ", error);
            res.writeHead(500);
        }
        res.end();
    });
};

export const addCustomToCartFromProfile = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
        const data = JSON.parse(body);
        const customData = data.data_pack;
        try {
            await database.query(
                "INSERT INTO carts(nbr_item, user_id, is_custom, custom_name, custom_price, custom_data) VALUES (1, $1, TRUE, $2, $3, $4)",
                [userId, customData.custom_name, customData.custom_price, customData.custom_data]
            );
            console.log(`Custom ${customData.custom_name} ajouté au panier`);
            res.writeHead(200);
        } catch (error) {
            console.error("Erreur API - Panier Custom, From Profile: ", error);
            res.writeHead(500);
        }
        res.end();
    });
};

export const deleteFromCart = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
        const data = JSON.parse(body);
        const isProductCustom = data.is_custom;
        try {
            if (isProductCustom) {
                const customName = data.custom_name;
                await database.query("DELETE FROM carts WHERE custom_name = $1 AND user_id = $2;", [
                    customName,
                    userId
                ]);
                console.log(`Custom ${customName} retiré du panier !!`);
            } else {
                const productId = data.product_id;
                await database.query("DELETE FROM carts WHERE product_id = $1 AND user_id = $2;", [productId, userId]);
                console.log(`Article ${productId} retiré du panier !!`);
            }
            res.writeHead(200, { Location: "/shop" });
        } catch (error) {
            console.error("Erreur API - Suppression Panier: ", error);
            res.writeHead(500);
        }
        res.end();
    });
};

export const updateProductQuantity = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
        const data = JSON.parse(body);
        const productId = data.product_id;
        const nbrProduct = data.quantity;
        try {
            await database.query("UPDATE carts SET nbr_item = $1 WHERE product_id = $2 AND user_id = $3;", [
                nbrProduct,
                productId,
                userId
            ]);
            console.log(`Article ${productId} passé à ${nbrProduct}`);
            res.writeHead(200, { Location: "/cart" });
        } catch (error) {
            console.error("Erreur API - Update Quantite panier: ", error);
            res.writeHead(500);
        }
        res.end();
    });
};

export const procedePaiement = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    try {
        const cartQuery = await database.query("SELECT * FROM carts WHERE user_id = $1;", [userId]);
        const userCart = cartQuery.rows;
        if (userCart.length === 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ message: "Panier vide" }));
            return;
        }
        const maxIdQuery = await database.query(
            "SELECT COALESCE(MAX(cart_id), 0) AS max_id FROM passed_carts WHERE user_id = $1;",
            [userId]
        );
        const newCartId = maxIdQuery.rows[0].max_id + 1;
        for (const product of userCart) {
            if (product.is_custom) {
                await database.query(
                    "INSERT INTO passed_carts(cart_id, nbr_item, user_id, is_custom, custom_name, custom_price, custom_data, status) VALUES ($1, $2, $3, true, $4, $5, $6, 'En cours de livraison');",
                    [
                        newCartId,
                        product.nbr_item,
                        userId,
                        product.custom_name,
                        product.custom_price,
                        product.custom_data
                    ]
                );
            } else {
                await database.query(
                    "INSERT INTO passed_carts(cart_id, product_id, nbr_item, user_id, status) VALUES ($1, $2, $3, $4, 'En cours de livraison');",
                    [newCartId, product.product_id, product.nbr_item, userId]
                );
            }
        }
        await database.query("DELETE FROM carts WHERE user_id = $1;", [userId]);
        console.log(`Commande n°${newCartId} validée pour l'utilisateur ${userId} !`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Commande validée" }));
    } catch (error) {
        console.error("Erreur API - Paiement: ", error);
        res.writeHead(500);
        res.end();
    }
};

// GET

export const loadCart = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    try {
        const cartProductsQuery = await database.query("SELECT * FROM carts WHERE user_id = $1;", [userId]);
        const cartProducts = cartProductsQuery.rows;
        let productList = [];
        for (const product of cartProducts) {
            if (product.is_custom) {
                const dataPack = {
                    cart_item_id: product.cart_item_id,
                    is_custom: true,
                    custom_name: product.custom_name,
                    custom_price: product.custom_price,
                    custom_data: product.custom_data,
                    nbr_item: product.nbr_item
                };
                productList.push(dataPack);
            } else {
                const productQuery = await database.query("SELECT * FROM products WHERE product_id = $1;", [
                    product.product_id
                ]);
                const productObject = productQuery.rows[0];
                productObject.cart_item_id = product.cart_item_id;
                productObject.is_custom = false;
                productObject.nbr_item = product.nbr_item;
                productList.push(productObject);
            }
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(productList));
    } catch (error) {
        console.error("Erreur API - Loading Cart: ", error);
        res.writeHead(500);
        res.end();
    }
};
