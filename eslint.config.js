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
                setTimeout: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error"
        }
    },
    prettier
];
