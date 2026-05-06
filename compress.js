import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const inputDir = "./public/3DModels/Raw_files";
const outputDir = "./public/3DModels/Compressed_files";

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log("Début de la compression des modèles 3D avec Draco...\n");

const files = fs.readdirSync(inputDir);

files.forEach((file) => {
    if (path.extname(file).toLowerCase() === ".glb") {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file);

        console.log(`Compression en cours : ${file}...`);

        try {
            const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
            execSync(`${npxCmd} gltf-pipeline -i "${inputPath}" -o "${outputPath}" -d`, { stdio: "inherit" });
        } catch (error) {
            console.error(`Erreur lors de la compression de ${file}: ${error}`);
        }
    }
});

console.log(`\nCompression terminée ! Tous tes modèles optimisés sont dans le dossier ${outputDir} !`);
