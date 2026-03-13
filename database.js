import {Client} from "pg"

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const products = [{
    name: "Produit 01",
    type: "Corps",
    price: 29.56,
    promo: 10
},
{
    name: "Produit 02",
    type: "Bouchon",
    price: 80.49,
    promo: 20
},
{
    name: "Produit 03",
    type: "Socle",
    price: 27.96,
    promo: null
},
{
    name: "Produit 04",
    type: "Habillage",
    price: 21.02,
    promo: null
},
{
    name: "Produit 05",
    type: "Habillage",
    price: 54.04,
    promo: null
},
{
    name: "Produit 06",
    type: "Corps",
    price: 72.30,
    promo: null
},
{
    name: "Produit 07",
    type: "Bouchon",
    price: 25.28,
    promo: 50
}];

const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS users(
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products(
        product_id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(30) NOT NULL,
        price NUMERIQUE(4, 2) NOT NULL,
        promo INT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS carts(
        cart_item_id SERIAL PRIMARY KEY,
        product_id INT NOT NULL REFERENCES products(product_id)
    );
    `;

const loadProducts = "INSERT INTO products(name, type, price, promo) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING;";

client.connect()
    .then(async () => {
        console.log("Connexion réussi !!");
        await client.query(createTablesQuery);
        console.log("Tables prêtes !!");
        for (const product of products) {
            await client.query(loadProducts, [product.name, product.type, product.price, product.promo]);
        }
        console.log("Produits log dans la Database !!");
    })
    .catch((error) => console.error("Erreur avec la DB : ", error.stack));

export default client;