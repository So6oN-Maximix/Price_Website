import http from "http";
import fs from "fs";
import path from "path";
import database from "./database.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import dns from "dns";
import "dotenv/config";

dns.setDefaultResultOrder("ipv4first");

const PORT = process.env.PORT || 8080;
const sessions = {};

const serverLunching = http.createServer(async (req, res) => {
    if (req.method === "POST") {
        if (req.url === "/api/login") {
            let body = "";
            req.on("data", (chunk) => (body += chunk.toString()));
            req.on("end", async () => {
                console.log(body);
                const formDatas = new URLSearchParams(body);
                const email = formDatas.get("email");
                const password = formDatas.get("password");
                try {
                    const result = await database.query("SELECT * FROM users WHERE email = $1;", [email]);
                    if (result.rows.length > 0) {
                        const userData = result.rows[0];
                        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
                        if (isPasswordCorrect) {
                            console.log(`Connexion réussie pour ${email}`);
                            const ticket = Math.random().toString(36).substring(7);
                            sessions[ticket] = {
                                username: userData.username,
                                user_id: userData.user_id
                            };

                            let redirectTo = "/profile";
                            const cookieHeader = req.headers.cookie;
                            if (cookieHeader) {
                                const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
                                if (cookies.return_to) {
                                    redirectTo = cookies.return_to;
                                }
                            }

                            res.writeHead(302, {
                                Location: redirectTo,
                                "Set-Cookie": [
                                    `session_id=${ticket}; Path=/; HttpOnly; Secure; SameSite=Strict`,
                                    `username=${userData.username}; Path=/; Secure; SameSite=Strict`,
                                    "return_to=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
                                ]
                            });
                        } else {
                            console.log("Échec : Mauvais mot de passe");
                            res.writeHead(302, { Location: "/login?error=1" });
                        }
                    } else {
                        console.log(`Echec de connexion ! Mauvais identifiants pour ${email}`);
                        res.writeHead(302, { Location: "/login?error=1" });
                    }
                } catch (error) {
                    console.error("Erreur SQL - Login : ", error);
                    res.writeHead(500);
                }
                res.end();
            });
            return;
        } else if (req.url === "/api/register") {
            let body = "";
            req.on("data", (chunk) => (body += chunk.toString()));
            req.on("end", async () => {
                console.log(body);
                const formDatas = new URLSearchParams(body);
                const username = formDatas.get("username");
                const email = formDatas.get("email");
                const password = formDatas.get("password");
                const confirmPassword = formDatas.get("confirm-password");
                if (password === confirmPassword) {
                    try {
                        const salt = await bcrypt.genSalt(15);
                        const hashedPassword = await bcrypt.hash(password, salt);
                        const defaultAvatar = `https://ui-avatars.com/api/?name=${username}&background=012911&color=ffffff&bold=true&length=1`;
                        await database.query(
                            "INSERT INTO users (username, email, password, profil_pic) VALUES ($1, $2, $3, $4);",
                            [username, email, hashedPassword, defaultAvatar]
                        );
                        console.log(`Bienvenue ${username}`);
                        res.writeHead(302, { Location: "/profile" });
                    } catch (error) {
                        console.error("Erreur SQL - Register : ", error);
                        res.writeHead(500);
                    }
                }
                res.end();
            });
            return;
        } else if (req.url === "/api/add-product-to-cart") {
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
            return;
        } else if (req.url === "/api/add-custom-to-cart") {
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
                    const getCustomQuery = await database.query(
                        "SELECT custom_id FROM customisation WHERE user_id = $1",
                        [userId]
                    );
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
            return;
        } else if (req.url === "/api/add-custom-to-cart-from-profile") {
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
            return;
        } else if (req.url === "/api/delete-from-cart") {
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
                        await database.query("DELETE FROM carts WHERE product_id = $1 AND user_id = $2;", [
                            productId,
                            userId
                        ]);
                        console.log(`Article ${productId} retiré du panier !!`);
                    }
                    res.writeHead(200, { Location: "/shop" });
                } catch (error) {
                    console.error("Erreur API - Suppression Panier: ", error);
                    res.writeHead(500);
                }
                res.end();
            });
            return;
        } else if (req.url === "/api/update-product-quantity") {
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
            return;
        } else if (req.url === "/api/procede-paiement") {
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
            return;
        } else if (req.url === "/api/create-post") {
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
                    await database.query(
                        "INSERT INTO inspi_posts(image, articles, description, nb_likes, nb_comments, user_id) VALUES($1, $2, $3, 0, 0, $4);",
                        [data.image, data.articles, data.description, userId]
                    );
                    console.log(`Nouveau post créé par l'utilisateur ${userId} !`);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Post publié" }));
                } catch (error) {
                    console.error("Erreur API - Loading New Post In DB: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/delete-post") {
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
                    const checkQuery = await database.query(
                        "SELECT user_id FROM inspi_posts WHERE inspi_post_id = $1;",
                        [data.post_id]
                    );
                    if (checkQuery.rows.length === 0 || checkQuery.rows[0].user_id !== userId) {
                        res.writeHead(403);
                        return res.end(JSON.stringify({ message: "Non autorisé" }));
                    }
                    await database.query("DELETE FROM inspi_posts WHERE inspi_post_id = $1;", [data.post_id]);
                    console.log(`Le post ${data.post_id} a été supprimé par l'utilisateur ${userId}`);
                    res.writeHead(200);
                    res.end(JSON.stringify({ message: "Post supprimé" }));
                } catch (error) {
                    console.error("Erreur API - Delete Post: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/forgot-password") {
            let body = "";
            req.on("data", (chunk) => (body += chunk.toString()));
            req.on("end", async () => {
                const data = JSON.parse(body);
                const userEmail = data.email;
                try {
                    const userIdQuery = await database.query("SELECT user_id FROM users WHERE email = $1;", [
                        userEmail
                    ]);
                    if (userIdQuery.rows.length === 0) {
                        res.writeHead(200, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ message: "Si cet email existe, un lien a été envoyé." }));
                    }
                    const resetToken = crypto.randomBytes(32).toString("hex");
                    const protocol = req.headers["x-forwarded-proto"] || "http";
                    const host = req.headers.host;
                    const resetLink = `${protocol}://${host}/reset-password?token=${resetToken}`;
                    await database.query(
                        "INSERT INTO password_resets (token, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes');",
                        [resetToken, userIdQuery.rows[0].user_id]
                    );

                    const brevoData = {
                        sender: {
                            name: "PRICE Support",
                            email: "maxime.leost@gmail.com"
                        },
                        to: [{ email: userEmail }],
                        subject: "Réinitialisation de ton mot de passe 🔒",
                        htmlContent: `
                            <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                                <h2>Oups, un trou de mémoire ? 😅</h2>
                                <p>Tu as demandé à réinitialiser ton mot de passe pour ton compte PRICE.</p>
                                <p>Clique sur le bouton ci-dessous pour en créer un nouveau :</p>
                                <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #4ade80; color: #0a0a0b; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                    Réinitialiser mon mot de passe
                                </a>
                                <p style="font-size: 0.8rem; color: #777;">Si tu n'as pas fait cette demande, ignore simplement cet email.</p>
                            </div>
                        `
                    };
                    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                        method: "POST",
                        headers: {
                            accept: "application/json",
                            "api-key": process.env.BREVO_API_KEY,
                            "content-type": "application/json"
                        },
                        body: JSON.stringify(brevoData)
                    });

                    if (!response.ok) {
                        const errorDetails = await response.text();
                        throw new Error(`Erreur API Brevo : ${errorDetails}`);
                    }
                    console.log(`Email de reset envoyé par API à ${userEmail}`);

                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Si cet email existe, un lien a été envoyé." }));
                } catch (error) {
                    console.error("Erreur API - Sending Email: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/change-password") {
            let body = "";
            req.on("data", (chunk) => (body += chunk.toString()));
            req.on("end", async () => {
                const data = JSON.parse(body);
                const token = data.token;
                const newPassword = data.password;
                try {
                    const tokenQuery = await database.query(
                        "SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > NOW();",
                        [token]
                    );
                    if (tokenQuery.rows.length === 0) {
                        res.writeHead(400, { "Content-Type": "application/json" });
                        return res.end(
                            JSON.stringify({ message: "Ce lien de réinitialisation est invalide ou a expiré." })
                        );
                    }
                    const userId = tokenQuery.rows[0].user_id;
                    const salt = await bcrypt.genSalt(15);
                    const hashedPassword = await bcrypt.hash(newPassword, salt);
                    await database.query("UPDATE users SET password = $1 WHERE user_id = $2;", [
                        hashedPassword,
                        userId
                    ]);
                    await database.query("DELETE FROM password_resets WHERE token = $1;", [token]);
                    console.log(`Mot de passe modifié avec succès pour l'utilisateur ID: ${userId}`);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Mot de passe mis à jour." }));
                } catch (error) {
                    console.error("Erreur API - Changing Password: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/update-profile-pic") {
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
            return;
        } else if (req.url === "/api/create-comment") {
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
                const postId = data.post_id;
                const comment = data.comment;
                try {
                    await database.query(
                        "INSERT INTO post_comments(comment, nb_likes, post_id, user_id) VALUES ($1, 0, $2, $3);",
                        [comment, postId, userId]
                    );
                    const currentCommentsQuery = await database.query(
                        "SELECT nb_comments FROM inspi_posts WHERE inspi_post_id = $1;",
                        [postId]
                    );
                    const currentComments = currentCommentsQuery.rows[0].nb_comments;
                    await database.query("UPDATE inspi_posts SET nb_comments = $1 WHERE inspi_post_id = $2;", [
                        currentComments + 1,
                        postId
                    ]);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Commentaire sauvegardée" }));
                } catch (error) {
                    console.error("Erreur API - Saving Post Comment: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/update-comments-number") {
            let body = "";
            req.on("data", (chunk) => (body += chunk.toString()));
            req.on("end", async () => {
                const data = JSON.parse(body);
                const postId = data.post_id;
                const nbComments = data.nb_comments;
                try {
                    (await database.query("UPDATE inspi_posts SET nb_comments = $1 WHERE inspi_post_id = $2;", [
                        nbComments,
                        postId
                    ]),
                        res.writeHead(200, { "Content-Type": "application/json" }));
                    res.end(JSON.stringify({ message: "Nombre de commentaire sauvegardée" }));
                } catch (error) {
                    console.error("Erreur API - Saving Number Post Comment: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/delete-comment") {
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
                const commentId = data.post_comment_id;
                const postId = data.post_id;
                try {
                    const checkQuery = await database.query(
                        "SELECT user_id FROM post_comments WHERE post_comment_id = $1;",
                        [commentId]
                    );
                    if (checkQuery.rows.length === 0 || checkQuery.rows[0].user_id !== userId) {
                        res.writeHead(403);
                        return res.end(JSON.stringify({ message: "Non autorisé" }));
                    }
                    await database.query("DELETE FROM post_comments WHERE post_comment_id = $1;", [commentId]);
                    const nbComments = await database.query(
                        "SELECT nb_comments FROM inspi_posts WHERE inspi_post_id = $1;",
                        [postId]
                    );
                    await database.query("UPDATE inspi_posts SET nb_comments = $1 WHERE inspi_post_id = $2;", [
                        nbComments.rows[0].nb_comments - 1,
                        postId
                    ]);
                    console.log(`Le commentaire ${commentId} a été supprimé par l'utilisateur ${userId}`);
                    res.writeHead(200);
                    res.end(JSON.stringify({ message: "Commentaire supprimé" }));
                } catch (error) {
                    console.error("Erreur API - Delete Comment: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/update-custom") {
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
                    const getUserIdQuery = await database.query(
                        "SELECT user_id FROM customisation WHERE user_id = $1;",
                        [userId]
                    );
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
            return;
        } else if (req.url === "/api/clear-custom") {
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
            return;
        } else if (req.url === "/api/delete-creation") {
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
            return;
        } else if (req.url === "/api/delete-account") {
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
            return;
        } else if (req.url === "/api/update-security") {
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
                    const userQuery = await database.query(
                        "SELECT password, email, username FROM users WHERE user_id = $1;",
                        [userId]
                    );
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
                    await database.query("UPDATE users SET password = $1 WHERE user_id = $2;", [
                        hashedNewPassword,
                        userId
                    ]);
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
            return;
        } else if (req.url === "/api/update-personal-info") {
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
                    const getPicQuery = await database.query("SELECT profil_pic FROM users WHERE user_id = $1;", [
                        userId
                    ]);
                    let currentPic = getPicQuery.rows[0].profil_pic;
                    let newPic = currentPic;
                    if (currentPic && currentPic.startsWith("https://ui-avatars.com/api/")) {
                        newPic = `https://ui-avatars.com/api/?name=${newUsername}&background=012911&color=ffffff&bold=true&length=1`;
                    }

                    await database.query(
                        "UPDATE users SET username = $1, email = $2, profil_pic = $3 WHERE user_id = $4;",
                        [newUsername, newEmail, newPic, userId]
                    );
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
            return;
        }
    } else if (req.method === "GET") {
        if (req.url === "/api/loadDatas") {
            try {
                const response = await database.query("SELECT * FROM products;");
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(response.rows));
            } catch (error) {
                console.error("Erreur API - Loading Products: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url === "/api/load-cart") {
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
            return;
        } else if (req.url.startsWith("/api/get-product-info")) {
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
            return;
        } else if (req.url === "/api/load-dashboard") {
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
                const designNbrQuery = await database.query("SELECT * FROM saved_customs WHERE user_id = $1;", [
                    userId
                ]);
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
            return;
        } else if (req.url === "/api/get-lasts-customs") {
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
            return;
        } else if (req.url === "/api/get-last-order") {
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
            return;
        } else if (req.url === "/api/load-orders") {
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
                    const orderQuery = await database.query(
                        "SELECT * FROM passed_carts WHERE user_id = $1 AND cart_id = $2;",
                        [userId, i]
                    );
                    cartsList.push(orderQuery.rows);
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(cartsList));
            } catch (error) {
                console.error("Erreur API - Loading Orders: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url === "/api/get-email") {
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
            return;
        } else if (req.url.startsWith("/api/get-product-type")) {
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
            return;
        } else if (req.url.startsWith("/api/get-user-info")) {
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
            return;
        } else if (req.url === "/api/loadInspiComments") {
            try {
                const commentQuery = await database.query("SELECT * FROM inspi_posts ORDER by date DESC;");
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(commentQuery.rows));
            } catch (error) {
                console.error("Erreur API - Loading Inspi Comments: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url === "/api/current-user-id") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return res.end(JSON.stringify(null));
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify(null));

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(sessionData.user_id));
            return;
        } else if (req.url === "/api/logout") {
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
            return;
        } else if (req.url.startsWith("/api/get-image?")) {
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
            return;
        } else if (req.url.startsWith("/api/add-like")) {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                return res.end();
            }
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                return res.end();
            }
            const userId = sessionData.user_id;

            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const postId = parsedUrl.searchParams.get("id");
            if (!postId) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: "ID manquant" }));
                return;
            }

            try {
                const nbLikeQuery = await database.query("SELECT nb_likes FROM inspi_posts WHERE inspi_post_id = $1;", [
                    postId
                ]);
                const nbLike = nbLikeQuery.rows[0].nb_likes;
                await database.query("INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2);", [userId, postId]);
                await database.query("UPDATE inspi_posts SET nb_likes = $1 WHERE inspi_post_id = $2;", [
                    nbLike + 1,
                    postId
                ]);
                console.log(`Like ajouté pour le post ID: ${userId}`);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Post Liké" }));
            } catch (error) {
                console.error("Erreur API - Adding Like: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url.startsWith("/api/remove-like")) {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                return res.end();
            }
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                return res.end();
            }
            const userId = sessionData.user_id;

            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const postId = parsedUrl.searchParams.get("id");
            if (!postId) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: "ID manquant" }));
                return;
            }

            try {
                const nbLikeQuery = await database.query("SELECT nb_likes FROM inspi_posts WHERE inspi_post_id = $1;", [
                    postId
                ]);
                const nbLike = nbLikeQuery.rows[0].nb_likes;
                await database.query("DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2;", [userId, postId]);
                await database.query("UPDATE inspi_posts SET nb_likes = $1 WHERE inspi_post_id = $2;", [
                    nbLike - 1,
                    postId
                ]);
                console.log(`Like retiré pour le post ID: ${userId}`);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Post Liké" }));
            } catch (error) {
                console.error("Erreur API - Adding Like: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url === "/api/load-posts") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return res.end(JSON.stringify([]));
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify([]));
            const userId = sessionData.user_id;

            try {
                const postsListQuery = await database.query("SELECT * FROM inspi_posts WHERE user_id = $1", [userId]);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(postsListQuery.rows));
            } catch (error) {
                console.error("Erreur API - Loading User's Post: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url.startsWith("/api/check-like?")) {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return res.end(JSON.stringify([]));
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify([]));
            const userId = sessionData.user_id;

            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const postId = parsedUrl.searchParams.get("id");
            if (!postId) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: "ID manquant" }));
                return;
            }

            try {
                const isLikedQuery = await database.query(
                    "SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2;",
                    [userId, postId]
                );
                let isLiked;
                if (isLikedQuery.rows.length === 0) {
                    isLiked = false;
                } else {
                    isLiked = true;
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(isLiked));
            } catch (error) {
                console.error("Erreur API - Loading Likes: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url.startsWith("/api/get-comments?")) {
            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const postId = parsedUrl.searchParams.get("id");
            if (!postId) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: "ID manquant" }));
                return;
            }
            try {
                const commentListQuery = await database.query("SELECT * FROM post_comments WHERE post_id = $1;", [
                    postId
                ]);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(commentListQuery.rows));
            } catch (error) {
                console.error("Erreur API - Loading Post Comments: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url.startsWith("/api/add-comment-like")) {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                return res.end();
            }
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                return res.end();
            }
            const userId = sessionData.user_id;

            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const commentId = parsedUrl.searchParams.get("id");
            if (!commentId) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: "ID manquant" }));
                return;
            }

            try {
                const nbLikeQuery = await database.query(
                    "SELECT nb_likes FROM post_comments WHERE post_comment_id = $1;",
                    [commentId]
                );
                const nbLike = nbLikeQuery.rows[0].nb_likes;
                await database.query("INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2);", [
                    userId,
                    commentId
                ]);
                await database.query("UPDATE post_comments SET nb_likes = $1 WHERE post_comment_id = $2;", [
                    nbLike + 1,
                    commentId
                ]);
                console.log(`Like ajouté pour le commentaire ID: ${commentId}`);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Commentaire Liké" }));
            } catch (error) {
                console.error("Erreur API - Adding Like: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url.startsWith("/api/remove-comment-like")) {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                return res.end();
            }
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                return res.end();
            }
            const userId = sessionData.user_id;

            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const commentId = parsedUrl.searchParams.get("id");
            if (!commentId) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: "ID manquant" }));
                return;
            }

            try {
                const nbLikeQuery = await database.query(
                    "SELECT nb_likes FROM post_comments WHERE post_comment_id = $1;",
                    [commentId]
                );
                const nbLike = nbLikeQuery.rows[0].nb_likes;
                await database.query("DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2;", [
                    userId,
                    commentId
                ]);
                await database.query("UPDATE post_comments SET nb_likes = $1 WHERE post_comment_id = $2;", [
                    nbLike - 1,
                    commentId
                ]);
                console.log(`Like retiré pour le commentaire ID: ${commentId}`);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Commentaire Déliké" }));
            } catch (error) {
                console.error("Erreur API - Removing Like: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url.startsWith("/api/check-comment-like?")) {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return res.end(JSON.stringify([]));
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify([]));
            const userId = sessionData.user_id;

            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const commentId = parsedUrl.searchParams.get("id");
            if (!commentId) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: "ID manquant" }));
                return;
            }

            try {
                const isLikedQuery = await database.query(
                    "SELECT * FROM comment_likes WHERE user_id = $1 AND comment_id = $2;",
                    [userId, commentId]
                );
                let isLiked;
                if (isLikedQuery.rows.length === 0) {
                    isLiked = false;
                } else {
                    isLiked = true;
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(isLiked));
            } catch (error) {
                console.error("Erreur API - Loading Likes: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url.startsWith("/api/get-selected?")) {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return res.end(JSON.stringify([]));
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify([]));
            const userId = sessionData.user_id;

            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const productType = parsedUrl.searchParams.get("type");
            if (!productType) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: "Type manquant" }));
                return;
            }

            try {
                const getSelectedProductQuery = await database.query(
                    `SELECT ${productType}_id FROM customisation WHERE user_id = $1;`,
                    [userId]
                );
                if (
                    getSelectedProductQuery.rows.length > 0 &&
                    getSelectedProductQuery.rows[0][`${productType}_id`] !== null
                ) {
                    const selectedProductId = getSelectedProductQuery.rows[0][`${productType}_id`];
                    const selectedProductName = await database.query(
                        "SELECT name FROM products WHERE product_id = $1;",
                        [selectedProductId]
                    );
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(selectedProductName.rows[0].name));
                } else {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(false));
                }
            } catch (error) {
                console.error("Erreur API - Getting Selected Product: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url === "/api/get-selected") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return res.end(JSON.stringify([]));
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify([]));
            const userId = sessionData.user_id;

            const types = ["bouchon", "corps", "habillage", "socle"];
            let selectedProducts = {};
            try {
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
                }
            } catch (error) {
                console.error("Erreur API - Getting All Selected Product: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url === "/api/load-creations") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return res.end(JSON.stringify([]));
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify([]));
            const userId = sessionData.user_id;
            try {
                const allCustomsQuery = await database.query("SELECT * FROM saved_customs WHERE user_id = $1;", [
                    userId
                ]);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(allCustomsQuery.rows));
            } catch (error) {
                console.error("Erreur API - Loading Customs: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        }
    }

    let filePath = "./public" + req.url;
    if (req.url === "/" || req.url === "") {
        filePath = "./public/index.html";
    } else if (req.url === "/login" || req.url.startsWith("/login?")) {
        filePath = "./public/login.html";
    } else if (req.url === "/shop") {
        filePath = "./public/shop.html";
    } else if (req.url === "/register") {
        filePath = "./public/register.html";
    } else if (req.url === "/profile") {
        const cookieHeader = req.headers.cookie;
        let estConnecte = false;
        if (cookieHeader) {
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            if (cookies.session_id && sessions[cookies.session_id]) {
                estConnecte = true;
            }
        }
        if (!estConnecte) {
            console.log("Accès refusé ou session expirée, retour au login !");
            res.writeHead(302, {
                Location: "/login",
                "Set-Cookie": [
                    "session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                    "username=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                    `return_to=${req.url}; Path=/; HttpOnly`
                ]
            });
            res.end();
            return;
        }
        filePath = "./public/profile.html";
    } else if (req.url === "/cart") {
        const cookieHeader = req.headers.cookie;
        let estConnecte = false;
        if (cookieHeader) {
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            if (cookies.session_id && sessions[cookies.session_id]) {
                estConnecte = true;
            }
        }
        if (!estConnecte) {
            console.log("Accès au panier refusé, retour au login !");
            res.writeHead(302, {
                Location: "/login",
                "Set-Cookie": [
                    "session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                    "username=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                    `return_to=${req.url}; Path=/; HttpOnly`
                ]
            });
            res.end();
            return;
        }
        filePath = "./public/cart.html";
    } else if (req.url === "/custom") {
        const cookieHeader = req.headers.cookie;
        let estConnecte = false;
        if (cookieHeader) {
            const cookies = Object.fromEntries(cookieHeader.split("; ").map((c) => c.split("=")));
            if (cookies.session_id && sessions[cookies.session_id]) {
                estConnecte = true;
            }
        }
        if (!estConnecte) {
            console.log("Accès à la personnalisation refusée, retour au login !");
            res.writeHead(302, {
                Location: "/login",
                "Set-Cookie": [
                    "session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                    "username=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                    `return_to=${req.url}; Path=/; HttpOnly`
                ]
            });
            res.end();
            return;
        }
        filePath = "./public/custom.html";
    } else if (req.url === "/product" || req.url.startsWith("/product?")) {
        filePath = "./public/product.html";
    } else if (req.url === "/community") {
        filePath = "./public/community.html";
    } else if (req.url === "/forget-password") {
        filePath = "./public/forget-password.html";
    } else if (req.url === "/reset-password" || req.url.startsWith("/reset-password?")) {
        filePath = "./public/reset-password.html";
    } else if (req.url === "/about-us") {
        filePath = "./public/about-us.html";
    }

    const extName = String(path.extname(filePath)).toLowerCase();

    const extTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript"
    };

    const contentType = extTypes[extName];

    fs.readFile(filePath, (err, content) => {
        if (err) {
            fs.readFile("./public/404.html", (err404, content404) => {
                res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
                res.end(content404, "utf-8");
            });
        } else {
            res.writeHead(200, {
                "Content-Type": `${contentType}; charset=utf-8`,
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY"
            });
            res.end(content, "utf-8");
        }
    });
});

serverLunching.listen(PORT, () => console.log(`Site lancé au PORT: ${PORT} !!`));
