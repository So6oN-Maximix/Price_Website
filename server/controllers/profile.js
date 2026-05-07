import database from "../database.js";
import bcrypt from "bcrypt";

// POST

export const updateProfilePic = async (req, res, sessions) => {
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
        const profilPic = data.profil_pic;
        try {
            await database.query("UPDATE users SET profil_pic = $1 WHERE user_id = $2;", [profilPic, userId]);
            console.log(`Photo de profil sauvegardée pour l'utilisateur ID: ${userId}`);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Photo de profil sauvegardée" }));
        } catch (error) {
            console.error("Erreur API - Saving Profil Picture: ", error);
            res.writeHead(500);
            res.end();
        }
    });
};

export const deleteCreation = async (req, res, sessions) => {
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
        const customName = data.custom_name;
        try {
            await database.query("DELETE FROM saved_customs WHERE user_id = $1 AND custom_name = $2;", [
                userId,
                customName
            ]);
            console.log(`Custom ${customName} supprimé !`);
            res.writeHead(200);
            res.end();
        } catch (error) {
            console.error("Erreur API - Delete Custom: ", error);
            res.writeHead(500);
            res.end();
        }
    });
};

export const deleteAccount = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    try {
        await database.query("DELETE FROM carts WHERE user_id = $1;", [userId]);
        await database.query("DELETE FROM passed_carts WHERE user_id = $1;", [userId]);
        await database.query("DELETE FROM saved_customs WHERE user_id = $1;", [userId]);
        await database.query("DELETE FROM customisation WHERE user_id = $1;", [userId]);
        await database.query("DELETE FROM post_likes WHERE user_id = $1;", [userId]);
        await database.query("DELETE FROM post_comments WHERE user_id = $1;", [userId]);
        await database.query("DELETE FROM comment_likes WHERE user_id = $1;", [userId]);
        await database.query("DELETE FROM inspi_posts WHERE user_id = $1;", [userId]);

        await database.query("DELETE FROM users WHERE user_id = $1;", [userId]);
        delete sessions[cookies.session_id];
        console.log(`Le compte de l'utilisateur ${userId} a été totalement effacé.`);
        res.writeHead(200, {
            "Set-Cookie": [
                "session_id=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                "username=; Path=/; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
            ],
            "Content-Type": "application/json"
        });
        res.end(JSON.stringify({ message: "Compte supprimé avec succès" }));
    } catch (error) {
        console.error("Erreur API - Delete Account: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const updateSecurity = async (req, res, sessions) => {
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
        const oldPassword = data.old_password;
        const newPassword = data.new_password;

        try {
            const userQuery = await database.query("SELECT password, email, username FROM users WHERE user_id = $1;", [
                userId
            ]);
            if (userQuery.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Utilisateur introuvable." }));
            }
            const userData = userQuery.rows[0];
            const isPasswordCorrect = await bcrypt.compare(oldPassword, userData.password);
            if (!isPasswordCorrect) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "L'ancien mot de passe est incorrect." }));
            }

            const salt = await bcrypt.genSalt(15);
            const hashedNewPassword = await bcrypt.hash(newPassword, salt);
            await database.query("UPDATE users SET password = $1 WHERE user_id = $2;", [hashedNewPassword, userId]);
            const brevoData = {
                sender: {
                    name: "PRICE Support",
                    email: "maxime.leost@gmail.com"
                },
                to: [{ email: userData.email }],
                subject: "Alerte Sécurité : Modification de votre mot de passe 🔒",
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; text-align: center; color: #333; padding: 20px;">
                        <h2>Bonjour ${userData.username},</h2>
                        <p>Nous vous confirmons que le mot de passe de votre compte a été modifié avec succès.</p>
                        <p style="margin: 30px 0; padding: 15px; background-color: #f1f5f9; border-left: 4px solid #3b82f6; text-align: left;">
                            <strong>Vous n'êtes pas à l'origine de cette action ?</strong><br>
                            Si vous n'avez pas modifié votre mot de passe, votre compte a peut-être été compromis. Veuillez nous contacter immédiatement.
                        </p>
                        <p style="font-size: 0.9rem; color: #777;">À très vite sur la boutique !</p>
                    </div>
                `
            };

            await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "api-key": process.env.BREVO_API_KEY,
                    "content-type": "application/json"
                },
                body: JSON.stringify(brevoData)
            });

            console.log(`Mot de passe mis à jour et email de sécurité envoyé à ${userData.email}`);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Mot de passe mis à jour." }));
        } catch (error) {
            console.error("Erreur API - Password changement: ", error);
            res.writeHead(500);
            res.end();
        }
    });
};

export const updatePersonalInfo = async (req, res, sessions) => {
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
        const newUsername = data.username;
        const newEmail = data.email;

        try {
            const checkDuplicate = await database.query(
                "SELECT user_id FROM users WHERE (email = $1 OR username = $2) AND user_id != $3;",
                [newEmail, newUsername, userId]
            );
            if (checkDuplicate.rows.length > 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(
                    JSON.stringify({
                        message: "Cet email ou ce nom d'utilisateur est déjà utilisé par un autre compte."
                    })
                );
            }
            const getPicQuery = await database.query("SELECT profil_pic FROM users WHERE user_id = $1;", [userId]);
            let currentPic = getPicQuery.rows[0].profil_pic;
            let newPic = currentPic;
            if (currentPic && currentPic.startsWith("https://ui-avatars.com/api/")) {
                newPic = `https://ui-avatars.com/api/?name=${newUsername}&background=012911&color=ffffff&bold=true&length=1`;
            }

            await database.query("UPDATE users SET username = $1, email = $2, profil_pic = $3 WHERE user_id = $4;", [
                newUsername,
                newEmail,
                newPic,
                userId
            ]);
            sessions[cookies.session_id].username = newUsername;
            console.log(`Profil mis à jour pour l'utilisateur ID: ${userId}`);
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Set-Cookie": `username=${newUsername}; Path=/; Secure; SameSite=Strict`
            });
            res.end(
                JSON.stringify({
                    message: "Informations mises à jour.",
                    new_profil_pic: newPic !== currentPic ? newPic : null
                })
            );
        } catch (error) {
            console.error("Erreur API - Update Personal Info: ", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end({ message: "Erreur interne du serveur." });
        }
    });
};

// GET

export const loadDashboard = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    try {
        const commandNbrQuery = await database.query(
            "SELECT MAX(cart_id) AS max FROM passed_carts WHERE user_id = $1;",
            [userId]
        );
        const designNbrQuery = await database.query("SELECT * FROM saved_customs WHERE user_id = $1;", [userId]);
        const allOrdersQuery = await database.query("SELECT * FROM passed_carts WHERE user_id = $1;", [userId]);
        let totalPrice = 0;
        for (const order of allOrdersQuery.rows) {
            if (!order.is_custom) {
                const productInfoQuery = await database.query(
                    "SELECT price, promo FROM products WHERE product_id = $1;",
                    [order.product_id]
                );
                if (productInfoQuery.rows[0].promo) {
                    totalPrice +=
                        Number(productInfoQuery.rows[0].price) *
                        (1 - Number(productInfoQuery.rows[0].promo) / 100) *
                        Number(order.nbr_item);
                } else {
                    totalPrice += Number(productInfoQuery.rows[0].price) * Number(order.nbr_item);
                }
            } else {
                totalPrice += Number(order.custom_price);
            }
        }
        const commandNumber = commandNbrQuery.rows[0].max === null ? 0 : commandNbrQuery.rows[0].max;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                command_nbr: commandNumber,
                design_nbr: designNbrQuery.rows.length,
                loyalty_pts: Number((totalPrice * 1.15).toFixed(0))
            })
        );
    } catch (error) {
        console.error("Erreur API - Loading Orders: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const getLastsCustoms = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    try {
        const getLastsCustomsQuery = await database.query(
            "SELECT * FROM saved_customs WHERE user_id = $1 ORDER BY date DESC LIMIT 2;",
            [userId]
        );
        res.writeHead(200);
        res.end(JSON.stringify(getLastsCustomsQuery.rows));
    } catch (error) {
        console.error("Erreur API - Get Lasts Customs: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const getLastOrder = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    try {
        const maxIdQuery = await database.query(
            "SELECT COALESCE(MAX(cart_id), 0) AS max_id FROM passed_carts WHERE user_id = $1;",
            [userId]
        );
        const getLastOrderQuery = await database.query(
            "SELECT * FROM passed_carts WHERE user_id = $1 AND cart_id = $2;",
            [userId, maxIdQuery.rows[0].max_id]
        );
        res.writeHead(200);
        res.end(JSON.stringify(getLastOrderQuery.rows));
    } catch (error) {
        console.error("Erreur API - Get Last Order: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const loadOrders = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    try {
        const maxIdQuery = await database.query(
            "SELECT COALESCE(MAX(cart_id), 0) AS max_id FROM passed_carts WHERE user_id = $1;",
            [userId]
        );
        let cartsList = [];
        for (let i = maxIdQuery.rows[0].max_id; i > 0; i--) {
            const orderQuery = await database.query("SELECT * FROM passed_carts WHERE user_id = $1 AND cart_id = $2;", [
                userId,
                i
            ]);
            cartsList.push(orderQuery.rows);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(cartsList));
    } catch (error) {
        console.error("Erreur API - Loading Orders: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const getEmail = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;
    try {
        const getEmailQuery = await database.query("SELECT email FROM users WHERE user_id = $1;", [userId]);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(getEmailQuery.rows[0].email));
    } catch (error) {
        console.error("Erreur API - Loading Settings: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const currentUserId = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify(null));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify(null));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(sessionData.user_id));
};

export const logout = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
        if (cookies.session_id) {
            delete sessions[cookies.session_id];
        }
    }
    res.writeHead(200, {
        "Set-Cookie": [
            "session_id=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
            "username=; Path=/; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
        ]
    });
    res.end();
};

export const getUserInfo = async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const userId = parsedUrl.searchParams.get("id");
    if (!userId) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "ID manquant" }));
        return;
    }
    try {
        const query = await database.query("SELECT * FROM users WHERE user_id = $1;", [userId]);
        if (query.rows.length === 0) {
            res.writeHead(404);
            res.end(JSON.stringify({ message: "Utilisateur inexistant" }));
            return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(query.rows[0]));
    } catch (error) {
        console.error("Erreur API - Get User ID: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const getImage = async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const userUsername = parsedUrl.searchParams.get("username");
    if (!userUsername) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "Username manquant" }));
        return;
    }
    try {
        const profilPicQuery = await database.query("SELECT profil_pic FROM users WHERE username = $1;", [
            userUsername
        ]);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(profilPicQuery.rows[0]));
    } catch (error) {
        console.error("Erreur API - Loading Profil Picture: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const loadCreations = async (req, res, sessions) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return res.end(JSON.stringify([]));
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
    const sessionData = sessions[cookies.session_id];
    if (!sessionData) return res.end(JSON.stringify([]));
    const userId = sessionData.user_id;

    try {
        const allCustomsQuery = await database.query("SELECT * FROM saved_customs WHERE user_id = $1;", [userId]);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(allCustomsQuery.rows));
    } catch (error) {
        console.error("Erreur API - Loading Customs: ", error);
        res.writeHead(500);
        res.end();
    }
};
