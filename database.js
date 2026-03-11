import {Client} from "pg"

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS users(
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        password TEXT NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    `;

client.connect()
    .then(async () => {
        console.log("Connexion réussi !!");
        await client.query(createTablesQuery);
        console.log("Tables prêtes !!");
    })
    .catch((error) => console.error("Erreur avec la DB : ", error.stack));

export default client;