import http from "http";
import fs from "fs";
import path from "path";
import dns from "dns";
import "dotenv/config";

import { login, register, forgetPassword, changePassword } from "./controllers/auth.js";
import {
    updateProfilePic,
    deleteCreation,
    deleteAccount,
    updateSecurity,
    updatePersonalInfo,
    loadDashboard,
    getLastsCustoms,
    getLastOrder,
    loadOrders,
    getEmail,
    currentUserId,
    logout,
    getUserInfo,
    getImage,
    loadCreations
} from "./controllers/profile.js";
import {
    addProductToCart,
    addCustomToCart,
    addCustomToCartFromProfile,
    deleteFromCart,
    updateProductQuantity,
    procedePaiement,
    loadCart
} from "./controllers/cart.js";
import {
    createPost,
    deletePost,
    createComment,
    updateCommentsNumber,
    deleteComment,
    loadInspiComments,
    addLike,
    removeLike,
    loadPosts,
    checkLike,
    getComments,
    addCommentLike,
    removeCommentLike,
    checkCommentLike
} from "./controllers/community.js";
import { updateCustom, clearCustom, getSelected } from "./controllers/custom.js";
import { loadDatas, getProductInfo, getProductType } from "./controllers/product.js";

dns.setDefaultResultOrder("ipv4first");

const PORT = process.env.PORT || 8080;
const sessions = {};

const postRoutes = {
    // Connexions
    "/api/login": (req, res) => login(req, res, sessions),
    "/api/register": (req, res) => register(req, res),
    "/api/forget-password": (req, res) => forgetPassword(req, res),
    "/api/change-password": (req, res) => changePassword(req, res),

    // Profile
    "/api/update-profile-pic": (req, res) => updateProfilePic(req, res, sessions),
    "/api/delete-creation": (req, res) => deleteCreation(req, res, sessions),
    "/api/delete-account": (req, res) => deleteAccount(req, res, sessions),
    "/api/update-security": (req, res) => updateSecurity(req, res, sessions),
    "/api/update-personal-info": (req, res) => updatePersonalInfo(req, res, sessions),

    // Cart
    "/api/add-product-to-cart": (req, res) => addProductToCart(req, res, sessions),
    "/api/add-custom-to-cart": (req, res) => addCustomToCart(req, res, sessions),
    "/api/add-custom-to-cart-from-profile": (req, res) => addCustomToCartFromProfile(req, res, sessions),
    "/api/delete-from-cart": (req, res) => deleteFromCart(req, res, sessions),
    "/api/update-product-quantity": (req, res) => updateProductQuantity(req, res, sessions),
    "/api/procede-paiement": (req, res) => procedePaiement(req, res, sessions),

    // Community
    "/api/create-post": (req, res) => createPost(req, res, sessions),
    "/api/delete-post": (req, res) => deletePost(req, res, sessions),
    "/api/create-comment": (req, res) => createComment(req, res, sessions),
    "/api/update-comments-number": (req, res) => updateCommentsNumber(req, res),
    "/api/delete-comment": (req, res) => deleteComment(req, res, sessions),

    // Custom
    "/api/update-custom": (req, res) => updateCustom(req, res, sessions),
    "/api/clear-custom": (req, res) => clearCustom(req, res, sessions)
};

const getRoutes = {
    // Product Manipulation
    "/api/load-datas": (req, res) => loadDatas(res),
    "/api/get-product-info": (req, res) => getProductInfo(req, res),
    "/api/get-product-type": (req, res) => getProductType(req, res),

    // Cart
    "/api/load-cart": (req, res) => loadCart(req, res, sessions),

    // Profile
    "/api/load-dashboard": (req, res) => loadDashboard(req, res, sessions),
    "/api/get-lasts-customs": (req, res) => getLastsCustoms(req, res, sessions),
    "/api/get-last-order": (req, res) => getLastOrder(req, res, sessions),
    "/api/load-orders": (req, res) => loadOrders(req, res, sessions),
    "/api/get-email": (req, res) => getEmail(req, res, sessions),
    "/api/current-user-id": (req, res) => currentUserId(req, res, sessions),
    "/api/logout": (req, res) => logout(req, res, sessions),
    "/api/get-user-info": (req, res) => getUserInfo(req, res),
    "/api/get-image": (req, res) => getImage(req, res),
    "/api/load-creations": (req, res) => loadCreations(req, res, sessions),

    // Community
    "/api/load-inspi-comments": (req, res) => loadInspiComments(res),
    "/api/add-like": (req, res) => addLike(req, res, sessions),
    "/api/remove-like": (req, res) => removeLike(req, res, sessions),
    "/api/load-posts": (req, res) => loadPosts(req, res, sessions),
    "/api/check-like": (req, res) => checkLike(req, res, sessions),
    "/api/get-comments": (req, res) => getComments(req, res),
    "/api/add-comment-like": (req, res) => addCommentLike(req, res, sessions),
    "/api/remove-comment-like": (req, res) => removeCommentLike(req, res, sessions),
    "/api/check-comment-like": (req, res) => checkCommentLike(req, res, sessions),

    // Custom
    "/api/get-selected": (req, res) => getSelected(req, res, sessions)
};

const serverLunching = http.createServer(async (req, res) => {
    if (req.method === "POST") {
        if (postRoutes[req.url]) {
            return postRoutes[req.url](req, res);
        }
    } else if (req.method === "GET") {
        const routeName = req.url.split("?")[0];
        if (getRoutes[routeName]) {
            return getRoutes[routeName](req, res);
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
        ".js": "text/javascript",
        ".glb": "model/gltf-binary",
        ".mp4": "video/mp4",
        ".ico": "image/x-icon",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml"
    };

    const contentType = extTypes[extName];

    let cacheControl = "no-cache";
    if ([".css", ".js", ".glb", ".mp4", ".ico", ".png", ".jpg", ".svg"].includes(extName)) {
        cacheControl = "public, max-age=2592000, immutable";
    }

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
                "X-Frame-Options": "DENY",
                "Cache-Control": cacheControl
            });
            res.end(content, "utf-8");
        }
    });
});

serverLunching.listen(PORT, () => console.log(`Site lancé au PORT: ${PORT} !!`));
