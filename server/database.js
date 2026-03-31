import {Pool} from "pg";

const client = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const products = [{
    name: "Produit 01",
    type: "Corps",
    price: 29.56,
    promo: 10,
    colors: ["#8F9779", "#006A71", "#CC6A5A", "#383E42"]
},
{
    name: "Produit 02",
    type: "Bouchon",
    price: 80.49,
    promo: 20,
    colors: ["#28282B", "#71797E", "#F5F5F0"]
},
{
    name: "Produit 03",
    type: "Socle",
    price: 27.96,
    promo: null,
    colors: ["#28282B", "#F2F4F4", "#FF5F00"]
},
{
    name: "Produit 04",
    type: "Habillage",
    price: 21.02,
    promo: null,
    colors: ["#D2A039", "#1A2F4B", "#A4A68C", "#E2C2C6"]
},
{
    name: "Produit 05",
    type: "Habillage",
    price: 54.04,
    promo: null,
    colors: ["#9E9E9E", "#72452D"]
},
{
    name: "Produit 06",
    type: "Corps",
    price: 72.30,
    promo: null,
    colors: ["#E1D5C9", "#5D6246", "#0A0A0A"]
},
{
    name: "Produit 07",
    type: "Bouchon",
    price: 25.28,
    promo: 50,
    colors: ["#1A2F4B", "#B84A39"]
}];

const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS users(
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profil_pic TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products(
        product_id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(30) NOT NULL,
        price NUMERIC(4, 2) NOT NULL,
        promo INT DEFAULT NULL,
        colors TEXT[]
    );

    CREATE TABLE IF NOT EXISTS carts(
        cart_item_id SERIAL PRIMARY KEY,
        product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
        nbr_item INT NOT NULL,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS passed_carts(
        cart_item_id SERIAL PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
        nbr_item INT NOT NULL,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inspi_posts(
        inspi_post_id SERIAL PRIMARY KEY,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        image TEXT NOT NULL,
        articles TEXT[] NOT NULL,
        description TEXT,
        nb_likes INT NOT NULL,
        nb_comments INT NOT NULL,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_likes (
        like_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        post_id INT REFERENCES inspi_comments(inspi_comment_id) ON DELETE CASCADE,
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS post_comments(
        post_comment_id SERIAL PRIMARY KEY,
        comment TEXT NOT NULL,
        nb_likes INT NOT NULL,
        post_id INT REFERENCES inspi_comments(inspi_comment_id) ON DELETE CASCADE,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comment_likes (
        like_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        comment_id INT REFERENCES post_comments(post_comment_id) ON DELETE CASCADE,
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, comment_id)
    );

    CREATE TABLE IF NOT EXISTS password_resets (
        token VARCHAR(255) PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL
    );
`;

client.query(createTablesQuery)
    .then(async () => {
        console.log("Connexion réussie et Tables prêtes !!");
        for (const product of products) {
            await client.query(
                "INSERT INTO products(name, type, price, promo, colors) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING;",
                [product.name, product.type, product.price, product.promo, product.colors]
            );
        }
        console.log("Produits log dans la Database !!");
    })
    .catch((err) => {
        console.error("Erreur d'initialisation de la DB :", err);
    });

export default client;