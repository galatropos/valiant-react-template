/* eslint-disable no-undef */
// scripts/createProject.js
import fs from "fs";
import path from "path";
import readline from "readline";

// 📌 Configurar readline para pedir el nombre
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Nombre del proyecto: ", (projectName) => {
  if (!projectName.trim()) {
    console.log("❌ El nombre no puede estar vacío.");
    rl.close();
    return;
  }

  const projectPath = path.join("project", projectName);

  // Lista de carpetas a crear
  const folders = [
    "assets/image",
    "assets/audio",
    "assets/video",
    "assets/font",
    "assets/material",
    "assets/style",
    "src/utils",
    "src/hook",
    "src/component",
    "src/context"
  ];

  try {
    // Crear carpeta principal
    fs.mkdirSync(projectPath, { recursive: true });

    // Crear subcarpetas
    folders.forEach(folder => {
      fs.mkdirSync(path.join(projectPath, folder), { recursive: true });
    });

    // Crear archivo Index.jsx
    const indexContent = `
function Index() {
  return ("Hola mundo")
}

export default Index;
`;
    fs.writeFileSync(path.join(projectPath, "Index.jsx"), indexContent.trim());

    console.log(`✅ Proyecto "${projectName}" creado en ${projectPath}`);
  } catch (err) {
    console.error("❌ Error creando el proyecto:", err);
  } finally {
    rl.close();
  }
});