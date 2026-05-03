# 💧 PRICE - E-commerce & Personnalisation de Gourdes

**PRICE** est une plateforme web e-commerce développée de zéro (sans framework frontend ni framework de routage backend comme Express). Elle permet aux utilisateurs d'acheter des gourdes, de créer leurs propres configurations sur-mesure, et de partager leurs créations avec la communauté.

---

## ✨ Fonctionnalités Principales

### 🛒 E-commerce & Panier
- Catalogue de produits standards.
- Système de panier dynamique (ajout, modification des quantités, suppression).
- Validation de commande et historique d'achats.

### 🎨 Outil de Personnalisation
- Configurateur 3D/Interactif (Bouchon, Corps, Habillage, Socle).
- Sauvegarde des créations dans le profil utilisateur ("Mes Créations").
- Ajout direct des gourdes personnalisées au panier.

### 👤 Système Utilisateur Complet
- Inscription et Connexion avec hachage des mots de passe (`bcrypt`).
- Gestion des sessions via cookies HTTPOnly et Secure.
- Tableau de bord personnalisé (statistiques, dernières commandes, dernières créations).
- Modification du profil (Pseudo, Email, Photo de profil avec avatars générés automatiquement ou upload).
- Sécurité : Changement de mot de passe avec envoi d'e-mail d'alerte.
- Oubli de mot de passe (génération d'un lien sécurisé et limité dans le temps).
- Suppression de compte complète (avec nettoyage en cascade de la base de données).

### 🌐 Espace Communauté
- Publication de posts inspirants (setups de gourdes).
- Système de "J'aime" sur les posts et les commentaires.
- Espace commentaires en direct.

---

## 🛠️ Technologies Utilisées

- **Frontend :** HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
- **Backend :** Node.js (Module HTTP natif)
- **Base de données :** PostgreSQL (via le module `pg`)
- **Sécurité & Auth :** `bcrypt` (hachage), `crypto` (tokens)
- **Mailing :** API Brevo (SMTP) pour les mails transactionnels et de sécurité.
- **Images par défaut :** API `ui-avatars.com`

---

## 🚀 Installation et Lancement

### 1. Prérequis
- [Node.js](https://nodejs.org/) installé sur votre machine.
- [PostgreSQL](https://www.postgresql.org/) installé et configuré.

### 2. Cloner le projet
```bash
git clone https://github.com/So6oN-Maximix/Price_Website.git
cd Price_Website
```

### 3. Installer les dépendances
```bash
npm install
```

### 4. Configuration de l'environnement (.env)
Créez un fichier `.env` à la racine du projet et ajoutez-y vos variables de configuration :
```env
DATABASE_URL=lien_vers_la_base_de_donnée
BREVO_API_KEY=votre_cle_api_brevo
```

### 5. Lancer le serveur
```bash
node .\server\index.js
```
Le site sera accessible sur `http://localhost:8080`.

---

## 📂 Structure du Projet

```text
📦 PRICE
 ┣ 📂 public               # Fichiers statiques (Frontend)
 ┃ ┣ 📂 css                # Feuilles de style
 ┃ ┣ 📂 js                 # Scripts frontend
 ┃ ┣ 📂 assets             # Images, icônes, favicon
 ┃ ┣ 📂 3DModels           # Modeles 3D
 ┃ ┣ 📜 index.html         # Page d'accueil
 ┃ ┣ 📜 profile.html       # Page profil & dashboard
 ┃ ┗ ...                   # Autres pages HTML
 ┣ 📂 server
 ┃ ┣ 📜 index.js           # Serveur Node.js (Backend & API)
 ┣ ┣ 📜 database.js        # Configuration de la connexion PostgreSQL
 ┣ 📜 package.json         # Dépendances du projet
 ┗ 📜 README.md            # Ce fichier
```

---

## 👨‍💻 Auteur

Développé par **Maxime LEOST** - 2026