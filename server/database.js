import { Pool } from "pg";

const client = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const products = [
    {
        name: "Produit 01",
        type: "corps",
        price: 29.56,
        promo: 10,
        colors: ["#8F9779", "#006A71", "#CC6A5A", "#383E42"],
        image: "https://res.cloudinary.com/dim1yekbi/image/upload/v1778583866/produit_01_a3tqri.png"
    },
    {
        name: "Produit 02",
        type: "bouchon",
        price: 80.49,
        promo: 20,
        colors: ["#28282B", "#71797E", "#F5F5F0"],
        image: "https://res.cloudinary.com/dim1yekbi/image/upload/v1778584257/produit_02_dptzmw.png"
    },
    {
        name: "Produit 03",
        type: "socle",
        price: 27.96,
        promo: null,
        colors: ["#28282B", "#F2F4F4", "#FF5F00"],
        image: "https://res.cloudinary.com/dim1yekbi/image/upload/v1778584257/produit_03_lesmrt.png"
    },
    {
        name: "Produit 04",
        type: "habillage",
        price: 21.02,
        promo: null,
        colors: ["#D2A039", "#1A2F4B", "#A4A68C", "#E2C2C6"],
        image: "https://res.cloudinary.com/dim1yekbi/image/upload/v1778584339/produit_04_kousyh.png"
    },
    {
        name: "Produit 05",
        type: "habillage",
        price: 54.04,
        promo: null,
        colors: ["#9E9E9E", "#72452D"],
        image: "https://res.cloudinary.com/dim1yekbi/image/upload/v1778584258/produit_05_wzibro.png"
    },
    {
        name: "Produit 06",
        type: "corps",
        price: 72.3,
        promo: null,
        colors: ["#E1D5C9", "#5D6246", "#0A0A0A"],
        image: "https://res.cloudinary.com/dim1yekbi/image/upload/v1778584257/produit_06_mqrhu8.png"
    },
    {
        name: "Produit 07",
        type: "bouchon",
        price: 25.28,
        promo: 50,
        colors: ["#1A2F4B", "#B84A39"],
        image: "https://res.cloudinary.com/dim1yekbi/image/upload/v1778584257/produit_07_eqdthy.png"
    }
];

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
        product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
        nbr_item INT NOT NULL,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        is_custom BOOLEAN DEFAULT FALSE,
        custom_name TEXT DEFAULT NULL,
        custom_price NUMERIC(6, 2) DEFAULT NULL,
        custom_data JSONB DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS passed_carts(
        cart_item_id SERIAL PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
        nbr_item INT NOT NULL,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        is_custom BOOLEAN DEFAULT FALSE,
        custom_name TEXT DEFAULT NULL,
        custom_price NUMERIC(6, 2) DEFAULT NULL,
        custom_data JSONB DEFAULT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        status TEXT DEFAULT NULL
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
        post_id INT REFERENCES inspi_posts(inspi_post_id) ON DELETE CASCADE,
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS post_comments(
        post_comment_id SERIAL PRIMARY KEY,
        comment TEXT NOT NULL,
        nb_likes INT NOT NULL,
        post_id INT REFERENCES inspi_posts(inspi_post_id) ON DELETE CASCADE,
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

    CREATE TABLE IF NOT EXISTS customisation (
        custom_id SERIAL PRIMARY KEY,
        bouchon_id INT REFERENCES products(product_id) ON DELETE RESTRICT,
        corps_id INT REFERENCES products(product_id) ON DELETE RESTRICT,
        habillage_id INT REFERENCES products(product_id) ON DELETE RESTRICT,
        socle_id INT REFERENCES products(product_id) ON DELETE RESTRICT,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_customs (
        custom_id SERIAL PRIMARY KEY,
        custom_name TEXT UNIQUE DEFAULT NULL,
        custom_price NUMERIC(6, 2) DEFAULT NULL,
        custom_data JSONB DEFAULT NULL,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
`;

client
    .query(createTablesQuery)
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
