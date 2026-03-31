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
            req.on("data", chunk => body += chunk.toString());
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
                            res.writeHead(302, {
                                "Location": "/profile",
                                "Set-Cookie": [`session_id=${ticket}; Path=/; HttpOnly; Secure; SameSite=Strict`,
                                                `username=${userData.username}; Path=/; Secure; SameSite=Strict`]
                            });
                        } else {
                            console.log("Échec : Mauvais mot de passe");
                            res.writeHead(302, {"Location": "/login?error=1"});
                        }
                    } else {
                        console.log(`Echec de connexion ! Mauvais identifiants pour ${email}`);
                        res.writeHead(302, {"Location": "/login?error=1"});
                    }
                } catch (error) {
                    console.error("Erreur SQL - Login : ", error);
                    res.writeHead(500);
                }
                res.end()
            });
            return;
        } else if (req.url === "/api/register") {
            let body = "";
            req.on("data", chunk => body += chunk.toString());
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
                        await database.query("INSERT INTO users (username, email, password, profil_pic) VALUES ($1, $2, $3, $4);", [username, email, hashedPassword, defaultAvatar]);
                        console.log(`Bienvenue ${username}`);
                        res.writeHead(302, {"Location": "/profile"});
                    } catch (error) {
                        console.error("Erreur SQL - Register : ", error);
                        res.writeHead(500);
                    }
                }
                res.end();
            });
            return;
        } else if (req.url === "/api/add-to-cart") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                res.end(JSON.stringify({ message: "Non connecté" }));
                return;
            }
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                res.end(JSON.stringify({ message: "Session expirée" }));
                return;
            }
            const userId = sessionData.user_id;

            let body = "";
            req.on("data", chunk => body += chunk.toString());
            req.on("end", async () => {
                const data = JSON.parse(body);
                const productName = data.product_name;
                try {
                    const getProductQuery = await database.query("SELECT product_id FROM products WHERE name = $1", [productName]);
                    const productId = getProductQuery.rows[0].product_id;
                    const isProductInCartQuery = await database.query("SELECT * FROM carts WHERE product_id = $1 AND user_id = $2", [productId, userId]);
                    if (isProductInCartQuery.rows.length > 0) {
                        const nbtItem = isProductInCartQuery.rows[0].nbr_item;
                        await database.query("UPDATE carts SET nbr_item = $1 WHERE product_id = $2 AND user_id = $3", [nbtItem + 1, productId, userId]);
                    } else {
                        await database.query("INSERT INTO carts(product_id, nbr_item, user_id) VALUES ($1, 1, $2);", [productId, userId]);
                        console.log(`Produit ${productId} ajouté dans la BDD`);
                    }
                    res.writeHead(200, {"Location": "/shop"});
                } catch (error) {
                    console.error("Erreur API - Panier: ", error);
                    res.writeHead(500);
                }
                res.end();
            });
            return;
        } else if (req.url === "/api/delete-from-cart") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                res.end(JSON.stringify({ message: "Non connecté" }));
                return;
            }
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                res.end(JSON.stringify({ message: "Session expirée" }));
                return;
            }
            const userId = sessionData.user_id;

            let body = "";
            req.on("data", chunk => body += chunk.toString());
            req.on("end", async () => {
                const data = JSON.parse(body);
                const productId = data.product_id;
                try {
                    await database.query("DELETE FROM carts WHERE product_id = $1 AND user_id = $2", [productId, userId]);
                    console.log(`Article ${productId} retiré du panier !!`);
                    res.writeHead(200, {"Location": "/shop"});
                } catch (error) {
                    console.error("Erreur API - Suppression Panier: ", error);
                    res.writeHead(500);
                }
                res.end()
            });
            return;
        } else if (req.url === "/api/update-product-quantity") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                res.end(JSON.stringify({ message: "Non connecté" }));
                return;
            }
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                res.end(JSON.stringify({ message: "Session expirée" }));
                return;
            }
            const userId = sessionData.user_id;

            let body = "";
            req.on("data", chunk => body += chunk.toString());
            req.on("end", async () => {
                const data = JSON.parse(body);
                const productId = data.product_id;
                const nbrProduct = data.quantity;
                try {
                    await database.query("UPDATE carts SET nbr_item = $1 WHERE product_id = $2 AND user_id = $3;", [nbrProduct, productId, userId]);
                    console.log(`Article ${productId} passé à ${nbrProduct}`);
                    res.writeHead(200, {"Location": "/cart"});
                } catch (error) {
                    console.error("Erreur API - Update Quantite panier: ", error);
                    res.writeHead(500);
                }
                res.end();
            });
            return;
        } else if (req.url === "/api/procede-paiement"){
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                res.end(JSON.stringify({ message: "Non connecté" }));
                return;
            }
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                res.end(JSON.stringify({ message: "Session expirée" }));
                return;
            }
            const userId = sessionData.user_id;

            try {
                const cartQuery = await database.query("SELECT * FROM carts WHERE user_id = $1;", [userId]);
                const userCart = cartQuery.rows;
                if (userCart.length === 0) {
                    res.writeHead(400); 
                    res.end(JSON.stringify({message: "Panier vide"}));
                    return;
                }
                const maxIdQuery = await database.query("SELECT COALESCE(MAX(cart_id), 0) AS max_id FROM passed_carts WHERE user_id = $1;", [userId]);
                const newCartId = maxIdQuery.rows[0].max_id + 1;
                for (const product of userCart) {
                    await database.query(
                        "INSERT INTO passed_carts(cart_id, product_id, nbr_item, user_id) VALUES ($1, $2, $3, $4);", 
                        [newCartId, product.product_id, product.nbr_item, userId]
                    );
                }
                await database.query("DELETE FROM carts WHERE user_id = $1;", [userId]);
                console.log(`Commande n°${newCartId} validée pour l'utilisateur ${userId} !`);
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({message: "Commande validée"}));

            } catch (error) {
                console.error("Erreur API - Paiement: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url === "/api/create-post") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                res.end(JSON.stringify({ message: "Non connecté" }));
                return;
            }
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                res.end(JSON.stringify({ message: "Session expirée" }));
                return;
            }
            const userId = sessionData.user_id;
            
            let body = "";
            req.on("data", chunk => body += chunk.toString());
            req.on("end", async () => {
                const data = JSON.parse(body);
                try {
                    await database.query(
                        "INSERT INTO inspi_comments(image, articles, description, nb_likes, nb_comments, user_id) VALUES($1, $2, $3, 0, 0, $4);",
                        [data.image, data.articles, data.description, userId]
                    );
                    console.log(`Nouveau post créé par l'utilisateur ${userId} !`);
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({message: "Post publié"}));
                } catch (error) {
                console.error("Erreur API - Loading New Post In DB: ", error);
                res.writeHead(500);
                res.end();
                }
            });
            return;
        } else if (req.url === "/api/delete-post") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                return res.end();
            }
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                return res.end();
            }
            const userId = sessionData.user_id;

            let body = "";
            req.on("data", chunk => body += chunk.toString());
            req.on("end", async () => {
                const data = JSON.parse(body);
                try {
                    const checkQuery = await database.query("SELECT user_id FROM inspi_comments WHERE inspi_comment_id = $1;", [data.post_id]);
                    if (checkQuery.rows.length === 0 || checkQuery.rows[0].user_id !== userId) {
                        res.writeHead(403);
                        return res.end(JSON.stringify({message: "Non autorisé"}));
                    }
                    await database.query("DELETE FROM inspi_comments WHERE inspi_comment_id = $1;", [data.post_id]);
                    console.log(`Le post ${data.post_id} a été supprimé par l'utilisateur ${userId}`);
                    res.writeHead(200);
                    res.end(JSON.stringify({message: "Post supprimé"}));
                } catch (error) {
                    console.error("Erreur API - Delete Post: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/forgot-password")  {
            let body = "";
            req.on("data", chunk => body += chunk.toString());
            req.on("end", async () => {
                const data = JSON.parse(body);
                const userEmail = data.email
                try {
                    const userIdQuery = await database.query("SELECT user_id FROM users WHERE email = $1;", [userEmail]);
                    if (userIdQuery.rows.length === 0) {
                        res.writeHead(200, {"Content-Type": "application/json"});
                        return res.end(JSON.stringify({message: "Si cet email existe, un lien a été envoyé."}));
                    }
                    const resetToken = crypto.randomBytes(32).toString('hex');
                    const protocol = req.headers['x-forwarded-proto'] || 'http';
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
                            "accept": "application/json",
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
                    
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({message: "Si cet email existe, un lien a été envoyé."}));
                } catch (error) {
                    console.error("Erreur API - Sending Email: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/change-password") {
            let body = "";
            req.on("data", chunk => body += chunk.toString());
            req.on("end", async () => {
                const data = JSON.parse(body);
                const token = data.token;
                const newPassword = data.password;
                try {
                    const tokenQuery = await database.query("SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > NOW();", [token]);
                    if (tokenQuery.rows.length === 0) {
                        res.writeHead(400, {"Content-Type": "application/json"});
                        return res.end(JSON.stringify({message: "Ce lien de réinitialisation est invalide ou a expiré."}));
                    }
                    const userId = tokenQuery.rows[0].user_id;
                    const salt = await bcrypt.genSalt(15);
                    const hashedPassword = await bcrypt.hash(newPassword, salt);
                    await database.query("UPDATE users SET password = $1 WHERE user_id = $2;", [hashedPassword, userId]);
                    await database.query("DELETE FROM password_resets WHERE token = $1;", [token]);
                    console.log(`Mot de passe modifié avec succès pour l'utilisateur ID: ${userId}`);
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({message: "Mot de passe mis à jour."}));
                } catch (error) {
                    console.error("Erreur API - Changing Password: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/update-profile-pic") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                return res.end();
            }
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                return res.end();
            }
            const userId = sessionData.user_id;

            let body = "";
            req.on("data", chunk => body += chunk.toString());
            req.on("end", async () => {
                const data = JSON.parse(body);
                const profilPic = data.profil_pic;
                try {
                    await database.query("UPDATE users SET profil_pic = $1 WHERE user_id = $2;", [profilPic, userId]);
                    console.log(`Photo de profil sauvegardée pour l'utilisateur ID: ${userId}`);
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({message: "Photo de profil sauvegardée"}));
                } catch (error) {
                    console.error("Erreur API - Saving Profil Picture: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/create-comment") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                return res.end();
            }
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                return res.end();
            }
            const userId = sessionData.user_id;

            let body = "";
            req.on("data", chunk => body += chunk.toString());
            req.on("end", async () => {
                const data = JSON.parse(body);
                const postId = data.post_id;
                const comment = data.comment;
                try {
                    await database.query("INSERT INTO post_comments(comment, nb_likes, post_id, user_id) VALUES ($1, 0, $2, $3);", [comment, postId, userId]);
                    const currentCommentsQuery = await database.query("SELECT nb_comments FROM inspi_comments WHERE inspi_comment_id = $1;", [postId]);
                    const currentComments = currentCommentsQuery.rows[0].nb_comments;
                    await database.query("UPDATE inspi_comments SET nb_comments = $1 WHERE inspi_comment_id = $2;", [currentComments + 1, postId])
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({message: "Commentaire sauvegardée"}));
                } catch (error) {
                    console.error("Erreur API - Saving Post Comment: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/update-comments-number") {
            let body = "";
            req.on("data", chunk => body += chunk.toString());
            req.on("end", async () => {
                const data = JSON.parse(body);
                const postId = data.post_id;
                const nbComments = data.nb_comments;
                try {
                    await database.query("UPDATE inspi_comments SET nb_comments = $1 WHERE inspi_comment_id = $2;", [nbComments, postId]),
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({message: "Nombre de commentaire sauvegardée"}));
                } catch (error) {
                    console.error("Erreur API - Saving Number Post Comment: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        } else if (req.url === "/api/delete-comment") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                res.writeHead(401);
                return res.end();
            }
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) {
                res.writeHead(401);
                return res.end();
            }
            const userId = sessionData.user_id;

            let body = "";
            req.on("data", chunk => body += chunk.toString());
            req.on("end", async () => {
                const data = JSON.parse(body);
                const commentId = data.post_comment_id;
                const postId = data.post_id;
                try {
                    const checkQuery = await database.query("SELECT user_id FROM post_comments WHERE post_comment_id = $1;", [commentId]);
                    if (checkQuery.rows.length === 0 || checkQuery.rows[0].user_id !== userId) {
                        res.writeHead(403);
                        return res.end(JSON.stringify({message: "Non autorisé"}));
                    }
                    await database.query("DELETE FROM post_comments WHERE post_comment_id = $1;", [commentId]);
                    const nbComments = await database.query("SELECT nb_comments FROM inspi_comments WHERE inspi_comment_id = $1;", [postId]);
                    await database.query("UPDATE inspi_comments SET nb_comments = $1 WHERE inspi_comment_id = $2;", [nbComments.rows[0].nb_comments - 1, postId]);
                    console.log(`Le commentaire ${commentId} a été supprimé par l'utilisateur ${userId}`);
                    res.writeHead(200);
                    res.end(JSON.stringify({message: "Commentaire supprimé"}));
                } catch (error) {
                    console.error("Erreur API - Delete Comment: ", error);
                    res.writeHead(500);
                    res.end();
                }
            });
            return;
        }
    } else if (req.method === "GET") {
        if (req.url === "/api/loadDatas") {
            try {
                const response = await database.query("SELECT * FROM products;");
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(response.rows));
            } catch (error) {
                console.error("Erreur API - Loading Products: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url === "/api/loadCart") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return res.end(JSON.stringify([]));
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify([]));
            const userId = sessionData.user_id;
            try {
                const cartProductsQuery = await database.query("SELECT product_id, nbr_item FROM carts WHERE user_id = $1;", [userId]);
                const cartProducts = cartProductsQuery.rows;
                let productList = [];
                for (const product of cartProducts) {
                    const productQuery = await database.query("SELECT * FROM products WHERE product_id = $1", [product.product_id]);
                    const productObject = productQuery.rows[0]
                    productObject.nbr_item = product.nbr_item;
                    productList.push(productObject);
                }
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(productList));
            } catch (error) {
                console.error("Erreur API - Loading Cart: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url.startsWith("/api/get-product-info")){
            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const productId = parsedUrl.searchParams.get("id");
            if (!productId) {
                res.writeHead(400);
                res.end(JSON.stringify({message: "ID manquant"}));
                return;
            }
            try {
                const query = await database.query("SELECT * FROM products WHERE product_id = $1;", [productId]);
                if (query.rows.length === 0) {
                    res.writeHead(404);
                    res.end(JSON.stringify({message: "Produit inexistant"}));
                    return;
                }
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(query.rows[0]));
            } catch (error) {
                console.error("Erreur API - Get Product ID: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url === "/api/loadOrders") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return res.end(JSON.stringify([]));
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify([]));
            const userId = sessionData.user_id;
            try {
                const maxIdQuery = await database.query("SELECT COALESCE(MAX(cart_id), 0) AS max_id FROM passed_carts WHERE user_id = $1;", [userId]);
                let cartsList = [];
                for (let i=maxIdQuery.rows[0].max_id; i>0; i--) {
                    const orderQuery = await database.query("SELECT * FROM passed_carts WHERE user_id = $1 AND cart_id = $2;", [userId, i]);
                    cartsList.push(orderQuery.rows);
                }
                res.writeHead(200, {"Content-Type": "application/json"});
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
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify([]));
            const userId = sessionData.user_id;
            try {
                const getEmailQuery = await database.query("SELECT email FROM users WHERE user_id = $1;", [userId]);
                res.writeHead(200, {"Content-Type": "application/json"});
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
                res.end(JSON.stringify({message: "Type manquant"}));
                return;
            }
            try {
                const getProducts = await database.query("SELECT * FROM products WHERE LOWER(type) = LOWER($1);", [productType]);
                if (getProducts.rows.length === 0) {
                    res.writeHead(404);
                    res.end(JSON.stringify({message: "Produit inexistant"}));
                    return;
                }
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(getProducts.rows));
            } catch (error) {
                console.error("Erreur API - Get Product type: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url.startsWith("/api/get-user-info")){
            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const userId = parsedUrl.searchParams.get("id");
            if (!userId) {
                res.writeHead(400);
                res.end(JSON.stringify({message: "ID manquant"}));
                return;
            }
            try {
                const query = await database.query("SELECT * FROM users WHERE user_id = $1;", [userId]);
                if (query.rows.length === 0) {
                    res.writeHead(404);
                    res.end(JSON.stringify({message: "Utilisateur inexistant"}));
                    return;
                }
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(query.rows[0]));
            } catch (error) {
                console.error("Erreur API - Get User ID: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url === "/api/loadInspiComments") {
            try {
                const commentQuery = await database.query("SELECT * FROM inspi_comments ORDER by date DESC;");
                res.writeHead(200, {"Content-Type": "application/json"});
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
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify(null));
            
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(sessionData.user_id));
            return;
        }else if (req.url === "/api/logout") {
            const cookieHeader = req.headers.cookie;
            if (cookieHeader) {
                const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
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
                res.end(JSON.stringify({message: "Username manquant"}));
                return;
            }
            try {
                const profilPicQuery = await database.query("SELECT profil_pic FROM users WHERE username = $1;", [userUsername]);
                res.writeHead(200, {"Content-Type": "application/json"});
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
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
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
                res.end(JSON.stringify({message: "ID manquant"}));
                return;
            }

            try {
                const nbLikeQuery = await database.query("SELECT nb_likes FROM inspi_comments WHERE inspi_comment_id = $1;", [postId]);
                const nbLike = nbLikeQuery.rows[0].nb_likes;
                await database.query("INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2);", [userId, postId]);
                await database.query("UPDATE inspi_comments SET nb_likes = $1 WHERE inspi_comment_id = $2;", [nbLike + 1, postId]);
                console.log(`Like ajouté pour le post ID: ${userId}`);
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({message: "Post Liké"}));
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
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
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
                res.end(JSON.stringify({message: "ID manquant"}));
                return;
            }

            try {
                const nbLikeQuery = await database.query("SELECT nb_likes FROM inspi_comments WHERE inspi_comment_id = $1;", [postId]);
                const nbLike = nbLikeQuery.rows[0].nb_likes;
                await database.query("DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2;", [userId, postId]);
                await database.query("UPDATE inspi_comments SET nb_likes = $1 WHERE inspi_comment_id = $2;", [nbLike - 1, postId]);
                console.log(`Like retiré pour le post ID: ${userId}`);
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({message: "Post Liké"}));
            } catch (error) {
                console.error("Erreur API - Adding Like: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url === "/api/load-posts") {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return res.end(JSON.stringify([]));
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify([]));
            const userId = sessionData.user_id;

            try {
                const postsListQuery = await database.query("SELECT * FROM inspi_comments WHERE user_id = $1", [userId]);
                res.writeHead(200, {"Content-Type": "application/json"});
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
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify([]));
            const userId = sessionData.user_id;

            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const postId = parsedUrl.searchParams.get("id");
            if (!postId) {
                res.writeHead(400);
                res.end(JSON.stringify({message: "ID manquant"}));
                return;
            }

            try {
                const isLikedQuery = await database.query("SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2;", [userId, postId]);
                let isLiked;
                if (isLikedQuery.rows.length === 0) {
                    isLiked = false;
                } else {
                    isLiked = true;
                }
                res.writeHead(200, {"Content-Type": "application/json"});
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
                res.end(JSON.stringify({message: "ID manquant"}));
                return;
            }
            try {
                const commentListQuery = await database.query("SELECT * FROM post_comments WHERE post_id = $1;", [postId]);
                res.writeHead(200, {"Content-Type": "application/json"});
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
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
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
                res.end(JSON.stringify({message: "ID manquant"}));
                return;
            }

            try {
                const nbLikeQuery = await database.query("SELECT nb_likes FROM post_comments WHERE post_comment_id = $1;", [commentId]);
                const nbLike = nbLikeQuery.rows[0].nb_likes;
                await database.query("INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2);", [userId, commentId]);
                await database.query("UPDATE post_comments SET nb_likes = $1 WHERE post_comment_id = $2;", [nbLike + 1, commentId]);
                console.log(`Like ajouté pour le commentaire ID: ${commentId}`);
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({message: "Commentaire Liké"}));
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
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
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
                res.end(JSON.stringify({message: "ID manquant"}));
                return;
            }

            try {
                const nbLikeQuery = await database.query("SELECT nb_likes FROM post_comments WHERE post_comment_id = $1;", [commentId]);
                const nbLike = nbLikeQuery.rows[0].nb_likes;
                await database.query("DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2;", [userId, commentId]);
                await database.query("UPDATE post_comments SET nb_likes = $1 WHERE post_comment_id = $2;", [nbLike - 1, commentId]);
                console.log(`Like retiré pour le commentaire ID: ${commentId}`);
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({message: "Commentaire Déliké"}));
            } catch (error) {
                console.error("Erreur API - Removing Like: ", error);
                res.writeHead(500);
                res.end();
            }
            return;
        } else if (req.url.startsWith("/api/check-comment-like?")) {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return res.end(JSON.stringify([]));
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const sessionData = sessions[cookies.session_id];
            if (!sessionData) return res.end(JSON.stringify([]));
            const userId = sessionData.user_id;

            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const commentId = parsedUrl.searchParams.get("id");
            if (!commentId) {
                res.writeHead(400);
                res.end(JSON.stringify({message: "ID manquant"}));
                return;
            }

            try {
                const isLikedQuery = await database.query("SELECT * FROM comment_likes WHERE user_id = $1 AND comment_id = $2;", [userId, commentId]);
                let isLiked;
                if (isLikedQuery.rows.length === 0) {
                    isLiked = false;
                } else {
                    isLiked = true;
                }
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(isLiked));
            } catch (error) {
                console.error("Erreur API - Loading Likes: ", error);
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
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            if (cookies.session_id && sessions[cookies.session_id]) {
                estConnecte = true;
            }
        }
        if (!estConnecte) {
            console.log("Accès refusé ou session expirée, retour au login !");
            res.writeHead(302, {
                "Location": "/login",
                "Set-Cookie": [
                    "session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                    "username=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
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
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            if (cookies.session_id && sessions[cookies.session_id]) {
                estConnecte = true;
            }
        }
        if (!estConnecte) {
            console.log("Accès au panier refusé, retour au login !");
            res.writeHead(302, {
                "Location": "/login",
                "Set-Cookie": [
                    "session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                    "username=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
                ]
            });
            res.end();
            return;
        }
        filePath = "./public/cart.html";
    } else if (req.url === "/custom"){
        filePath = "./public/custom.html";
    } else if (req.url === "/product" || req.url.startsWith("/product?")){
        filePath = "./public/product.html";
    } else if (req.url === "/community") {
        filePath = "./public/community.html";
    } else if (req.url === "/forget-password"){
        filePath = "./public/forget-password.html"
    } else if (req.url === "/reset-password" ||req.url.startsWith("/reset-password?")) {
        filePath = "./public/reset-password.html";
    }

    const extName = String(path.extname(filePath)).toLowerCase();

    const extTypes = {
        ".html" : "text/html",
        ".css" : "text/css",
        ".js" : "text/javascript"
    };

    const contentType = extTypes[extName];

    fs.readFile(filePath, (err, content) => {
        if (err) {
            fs.readFile("./public/404.html", (err404, content404) => {
                res.writeHead(404, { "Content-Type": "text/html; charset=utf-8"});
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