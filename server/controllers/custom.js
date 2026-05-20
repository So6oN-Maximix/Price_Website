import database from "../database.js";

// POST

export const updateCustom = async (req, res, sessions) => {
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
        const selectedProducts = data.product_list;
        try {
            const getUserIdQuery = await database.query("SELECT user_id FROM customisation WHERE user_id = $1;", [
                userId
            ]);
            const isCustomExists = getUserIdQuery.rows.length > 0 ? true : false;
            if (!isCustomExists) {
                await database.query(
                    "INSERT INTO customisation(bouchon_id, corps_id, habillage_id, socle_id, user_id) VALUES ($1, $2, $3, $4, $5);",
                    [null, null, null, null, userId]
                );
                console.log(`La customisation de l'utilisateur ${userId} a été crée`);
            }
            for (const type in selectedProducts) {
                if (selectedProducts[type] != "") {
                    const selectedId = selectedProducts[type] === -1 ? null : selectedProducts[type];
                    await database.query(`UPDATE customisation SET ${type}_id = $1 WHERE user_id = $2;`, [
                        selectedId,
                        userId
                    ]);
                }
            }
            console.log(`La customisation de l'utilisateur ${userId} a été mise à jour`);
            res.writeHead(200);
            res.end(JSON.stringify({ message: "BDD customisation mise à jour" }));
        } catch (error) {
            console.error("Erreur API - Load Custom: ", error);
            res.writeHead(500);
            res.end();
        }
    });
};

export const clearCustom = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    try {
        await database.query(
            "UPDATE customisation SET bouchon_id = null, corps_id = null, habillage_id = null, socle_id = null WHERE user_id = $1",
            [userId]
        );
        res.writeHead(200);
        res.end();
    } catch (error) {
        console.error("Erreur API - Reset Custom: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const addToCustom = async (req, res, sessions) => {
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
        try {
            await database.query(`UPDATE customisation SET ${data.type}_id = $1 WHERE user_id = $2;`, [
                data.product_id,
                userId
            ]);
            res.writeHead(200);
            res.end();
        } catch (error) {
            console.error("Erreur API - Add To Custom: ", error);
            res.writeHead(500);
            res.end();
        }
    });
};

// GET

export const getSelected = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const productType = parsedUrl.searchParams.get("type");

    try {
        if (productType) {
            const getSelectedProductQuery = await database.query(
                `SELECT ${productType}_id FROM customisation WHERE user_id = $1;`,
                [userId]
            );
            if (
                getSelectedProductQuery.rows.length > 0 &&
                getSelectedProductQuery.rows[0][`${productType}_id`] !== null
            ) {
                const selectedProductId = getSelectedProductQuery.rows[0][`${productType}_id`];
                const selectedProductName = await database.query("SELECT name FROM products WHERE product_id = $1;", [
                    selectedProductId
                ]);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(selectedProductName.rows[0].name));
            } else {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(false));
            }
        } else {
            const types = ["bouchon", "corps", "habillage", "socle"];
            let selectedProducts = {};
            const selectedProductsQuery = await database.query("SELECT * FROM customisation WHERE user_id = $1;", [
                userId
            ]);
            if (selectedProductsQuery.rows.length > 0) {
                const queryLine = selectedProductsQuery.rows[0];
                for (const type of types) {
                    const productTypeId =
                        queryLine[`${type.toLowerCase()}_id`] != null ? queryLine[`${type.toLowerCase()}_id`] : "";
                    selectedProducts[type] = productTypeId;
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(selectedProducts));
            } else {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({}));
            }
        }
    } catch (error) {
        console.error("Erreur API - Getting Selected Product(s): ", error);
        res.writeHead(500);
        res.end();
    }
};

export const getCreationType = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const creationType = parsedUrl.searchParams.get("productType");
    if (!creationType) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "Type manquant" }));
        return;
    }

    try {
        const creationListQuery = await database.query(
            "SELECT * FROM created_parts WHERE type = $1 AND user_id = $2 ORDER BY creation_id;",
            [creationType, userId]
        );
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(creationListQuery.rows));
    } catch (error) {
        console.error("Erreur API - Get Creation Type: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const getCreationInfo = async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const creationId = parsedUrl.searchParams.get("id");
    if (!creationId) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "ID manquant" }));
        return;
    }

    try {
        const query = await database.query("SELECT * FROM created_parts WHERE creation_id = $1;", [creationId]);
        if (query.rows.length === 0) {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Création introuvable" }));
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(query.rows[0]));
    } catch (error) {
        console.error("Erreur API - Get Creation Info: ", error);
        res.writeHead(500);
        res.end();
    }
};
