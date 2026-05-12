import database from "../database.js";

// GET

export const loadDatas = async (res) => {
    try {
        const response = await database.query("SELECT * FROM products ORDER BY name;");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response.rows));
    } catch (error) {
        console.error("Erreur API - Loading Products: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const getProductInfo = async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const productId = parsedUrl.searchParams.get("id");
    if (!productId) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "ID manquant" }));
        return;
    }
    try {
        const query = await database.query("SELECT * FROM products WHERE product_id = $1;", [productId]);
        if (query.rows.length === 0) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    name: "∅",
                    type: null,
                    price: 0.0,
                    promo: null
                })
            );
        } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(query.rows[0]));
        }
    } catch (error) {
        console.error("Erreur API - Get Product ID: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const getProductType = async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const productType = parsedUrl.searchParams.get("productType");
    if (!productType) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "Type manquant" }));
        return;
    }
    try {
        const getProducts = await database.query("SELECT * FROM products WHERE type = $1;", [productType]);
        if (getProducts.rows.length === 0) {
            res.writeHead(404);
            res.end(JSON.stringify({ message: "Produit inexistant" }));
            return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(getProducts.rows));
    } catch (error) {
        console.error("Erreur API - Get Product type: ", error);
        res.writeHead(500);
        res.end();
    }
};
