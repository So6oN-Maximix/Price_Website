import http from "http";
import fs from "fs";
import path from "path";
import database from "./database.js";
import bcrypt from "bcrypt";

const PORT = process.env.PORT || 8080;

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
                            res.writeHead(302, {"Location": "/profile"});
                        } else {
                            console.log("Échec : Mauvais mot de passe");
                            res.writeHead(302, {"Location": "/login?error=1"});
                        }
                    } else {
                        console.log(`Echec de connexion ! Mauvais identifiants pour ${username}`);
                        res.writeHead(302, {"Location": "/login"});
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
                        await database.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3);", [username, email, hashedPassword]);
                        console.log(`Bienvenue ${username}`);
                        res.writeHead(302, {"Location": "/profile"});
                    } catch (error) {
                        console.error("Erreur SQL - Register : ", error);
                        req.writeHead(500);
                    }
                }
                res.end();
            });
            return;
        }
    }

    let filePath = "." + req.url;
    if (req.url === "/" || req.url === "") {
        filePath = "./index.html";
    } else if (req.url === "/login") {
        filePath = "./login.html";
    } else if (req.url === "/shop") {
        filePath = "./shop.html";
    } else if (req.url === "/register") {
        filePath = "./register.html";
    } else if (req.url === "/profile") {
        filePath = "./profile.html";
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
            fs.readFile("./404.html", (err404, content404) => {
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
    })
});

serverLunching.listen(PORT, () => console.log(`Serveur lancé à l'adresse : http://localhost:${PORT}`));