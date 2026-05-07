import database from "../database.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// POST

export const login = async (req, res, sessions) => {
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
};

export const register = async (req, res) => {
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
};

export const forgetPassword = async (req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
        const data = JSON.parse(body);
        const userEmail = data.email;
        try {
            const userIdQuery = await database.query("SELECT user_id FROM users WHERE email = $1;", [userEmail]);
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
};

export const changePassword = async (req, res) => {
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
                return res.end(JSON.stringify({ message: "Ce lien de réinitialisation est invalide ou a expiré." }));
            }
            const userId = tokenQuery.rows[0].user_id;
            const salt = await bcrypt.genSalt(15);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            await database.query("UPDATE users SET password = $1 WHERE user_id = $2;", [hashedPassword, userId]);
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
};
