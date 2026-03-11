import http from "http";
import fs from "fs";
import path from "path";

const PORT = 8080;

const serverLunching = http.createServer(async (req, res) => {
    let filePath = "." + req.url;
    if (req.url === "/" || req.url === "") {
        filePath = "./index.html";
    } else if (req.url === "/login") {
        filePath = "./login.html";
    } else if (req.url === "/shop") {
        filePath = "./shop.html";
    } else if (req.url === "/register") {
        filePath = "./register.html";
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