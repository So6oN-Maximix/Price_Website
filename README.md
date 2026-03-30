# 💧 PRICE - Your Custom Water Bottle Experience

**PRICE** est une plateforme web complète d'e-commerce et de création de gourdes 100% personnalisables. Bien plus qu'une simple boutique, le site intègre un véritable aspect communautaire où les utilisateurs peuvent partager leurs créations, s'inspirer, liker et commenter les setups des autres.

## ✨ Fonctionnalités Principales

🛍️ **E-Commerce & Personnalisation**
* Outil de customisation interactif (choix du corps, bouchon, socle, et habillage).
* Système de panier dynamique (ajout, modification des quantités, suppression).
* Simulation de validation de commande.

🌐 **Réseau Social Intégré (La Communauté)**
* Fil d'actualité listant les créations des utilisateurs.
* Système de "Posts" avec image, badges des composants utilisés, et description.
* Interactions en temps réel : Likes optimistes (+1 immédiat) et système de commentaires imbriqués (avec likes sur les commentaires).
* Profil utilisateur listant l'historique des commandes et les posts publiés.

🔒 **Authentification & Sécurité**
* Inscription et Connexion sécurisées (hashage des mots de passe avec `bcrypt`).
* Gestion de sessions par cookies HTTP-Only.
* Récupération de mot de passe par email avec tokens sécurisés (via l'API Brevo).
* Génération automatique d'avatars personnalisés pour les nouveaux inscrits (via UI Avatars).

## 🛠️ Stack Technique

Le projet a été développé de manière native pour bien maîtriser les fondamentaux du web :
* **Frontend :** HTML5, CSS3, JavaScript (Vanilla).
* **Backend :** Node.js (Utilisation native du module `http`, sans framework comme Express).
* **Base de données :** PostgreSQL (module `pg`).
* **Déploiement :** Compatible avec les hébergeurs modernes comme Railway.

## 📂 Architecture du Projet

Le projet respecte une séparation stricte entre le client et le serveur :

```text
PRICE/
├── public/                 # 🖥️ Frontend (Fichiers statiques envoyés au navigateur)
│   ├── assets/             # Images, polices...
│   ├── css/                # Feuilles de style
│   ├── js/                 # Scripts côté client (DOM, Fetch API)
│   └── *.html              # Pages web
├── server/                 # ⚙️ Backend (Logique serveur)
│   ├── index.js            # Point d'entrée, serveur HTTP et routeur API
│   └── database.js         # Configuration PostgreSQL et création des tables
├── package.json            # Dépendances du projet
└── .env                    # Variables d'environnement (ignoré par Git)
```

## 🚀 Installation et Lancement en local

1. **Cloner le dépôt :**
    ```bash
    git clone [https://github.com/So6oN-Maximix/Price_Website.git](https://github.com/So6oN-Maximix/Price_Website.git)
    cd Price_Website
    ```
2. **Installation des dépendances :**
    ```bash
    npm install
    ```

3. **Configuration de l'environnement :**

    Crée un fichier `.env` à la racine du projet et ajoutes-y ces variables :
    ```bash
    PORT=8080
    # Lien de connexion à ta base de données PostgreSQL
    DATABASE_URL=postgresql://postgres:ton_mot_de_passe@localhost:5432/PRICE_db
    # Clé API Brevo pour l'envoi d'emails (Mot de passe oublié)
    BREVO_API_KEY=ta_cle_api_brevo
    ```

4. **Base de données :**

    *Assure-toi que PostgreSQL tourne sur ta machine.*

    Au premier lancement, le fichier `/server/database.js` se chargera automatiquement de créer toutes les tables SQL nécessaires (users, products, carts, inspi_comments, etc.) et d'insérer les produits de base !

5. **Lancer le server**

    ```bash
    node ./server/index.js
    ```
    *Le site sera accessible à l'adresse : `http://localhost:8080`*

## ✍️ Auteur
**Maxime LEOST**

*GitHub* : [@So6oN-Maximix](https://github.com/So6oN-Maximix)

*LinkedIn* : [Mon Profil](https://www.linkedin.com/in/maxime-leost-ba6083328/)