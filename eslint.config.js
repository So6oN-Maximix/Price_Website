import prettier from "eslint-plugin-prettier/recommended";

export default [
    {
        ignores: ["node_modules/", "public/3DModels/", "public/assets/"]
    },
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                document: "readonly",
                window: "readonly",
                fetch: "readonly",
                console: "readonly",
                process: "readonly",
                setTimeout: "readonly",
                alert: "readonly",
                confirm: "readonly",
                requestAnimationFrame: "readonly",
                FileReader: "readonly",
                URLSearchParams: "readonly",
                URL: "readonly",

                THREE: "readonly",

                currentUserId: "writable",
                addToComment: "readonly",
                toggleNavMenu: "readonly",
                loadAnimation: "readonly",
                login: "readonly",
                register: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error"
        }
    },
    prettier
];
