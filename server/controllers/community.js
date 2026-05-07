import database from "../database.js";

// POST

export const createPost = async (req, res, sessions) => {
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
};

export const deletePost = async (req, res, sessions) => {
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
            const checkQuery = await database.query("SELECT user_id FROM inspi_posts WHERE inspi_post_id = $1;", [
                data.post_id
            ]);
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
};

export const createComment = async (req, res, sessions) => {
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
};

export const updateCommentsNumber = async (req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
        const data = JSON.parse(body);
        const postId = data.post_id;
        const nbComments = data.nb_comments;
        try {
            await database.query("UPDATE inspi_posts SET nb_comments = $1 WHERE inspi_post_id = $2;", [
                nbComments,
                postId
            ]);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Nombre de commentaire sauvegardée" }));
        } catch (error) {
            console.error("Erreur API - Saving Number Post Comment: ", error);
            res.writeHead(500);
            res.end();
        }
    });
};

export const deleteComment = async (req, res, sessions) => {
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
            const checkQuery = await database.query("SELECT user_id FROM post_comments WHERE post_comment_id = $1;", [
                commentId
            ]);
            if (checkQuery.rows.length === 0 || checkQuery.rows[0].user_id !== userId) {
                res.writeHead(403);
                return res.end(JSON.stringify({ message: "Non autorisé" }));
            }
            await database.query("DELETE FROM post_comments WHERE post_comment_id = $1;", [commentId]);
            const nbComments = await database.query("SELECT nb_comments FROM inspi_posts WHERE inspi_post_id = $1;", [
                postId
            ]);
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
};

// GET

export const loadInspiComments = async (res) => {
    try {
        const commentQuery = await database.query("SELECT * FROM inspi_posts ORDER by date DESC;");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(commentQuery.rows));
    } catch (error) {
        console.error("Erreur API - Loading Inspi Comments: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const addLike = async (req, res, sessions) => {
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
        const nbLikeQuery = await database.query("SELECT nb_likes FROM inspi_posts WHERE inspi_post_id = $1;", [
            postId
        ]);
        const nbLike = nbLikeQuery.rows[0].nb_likes;
        await database.query("INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2);", [userId, postId]);
        await database.query("UPDATE inspi_posts SET nb_likes = $1 WHERE inspi_post_id = $2;", [nbLike + 1, postId]);
        console.log(`Like ajouté pour le post ID: ${userId}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Post Liké" }));
    } catch (error) {
        console.error("Erreur API - Adding Like: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const removeLike = async (req, res, sessions) => {
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
        const nbLikeQuery = await database.query("SELECT nb_likes FROM inspi_posts WHERE inspi_post_id = $1;", [
            postId
        ]);
        const nbLike = nbLikeQuery.rows[0].nb_likes;
        await database.query("DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2;", [userId, postId]);
        await database.query("UPDATE inspi_posts SET nb_likes = $1 WHERE inspi_post_id = $2;", [nbLike - 1, postId]);
        console.log(`Like retiré pour le post ID: ${userId}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Post Liké" }));
    } catch (error) {
        console.error("Erreur API - Adding Like: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const loadPosts = async (req, res, sessions) => {
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
};

export const checkLike = async (req, res, sessions) => {
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
        const isLikedQuery = await database.query("SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2;", [
            userId,
            postId
        ]);
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
};

export const getComments = async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const postId = parsedUrl.searchParams.get("id");
    if (!postId) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "ID manquant" }));
        return;
    }
    try {
        const commentListQuery = await database.query("SELECT * FROM post_comments WHERE post_id = $1;", [postId]);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(commentListQuery.rows));
    } catch (error) {
        console.error("Erreur API - Loading Post Comments: ", error);
        res.writeHead(500);
        res.end();
    }
};

export const addCommentLike = async (req, res, sessions) => {
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
        const nbLikeQuery = await database.query("SELECT nb_likes FROM post_comments WHERE post_comment_id = $1;", [
            commentId
        ]);
        const nbLike = nbLikeQuery.rows[0].nb_likes;
        await database.query("INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2);", [userId, commentId]);
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
};

export const removeCommentLike = async (req, res, sessions) => {
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
        const nbLikeQuery = await database.query("SELECT nb_likes FROM post_comments WHERE post_comment_id = $1;", [
            commentId
        ]);
        const nbLike = nbLikeQuery.rows[0].nb_likes;
        await database.query("DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2;", [userId, commentId]);
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
};

export const checkCommentLike = async (req, res, sessions) => {
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
};
