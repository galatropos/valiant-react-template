/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'dist', 'index.html');

if (!fs.existsSync(filePath)) {
  console.error(`❌ No se encontró el archivo: ${filePath}`);
  process.exit(1);
}

const stats = fs.statSync(filePath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log(`📦 Tamaño final: ${sizeMB} MB`);

if (sizeMB > 5) {
  console.warn(`⚠️ Supera el límite de 5MB!`);
  process.exitCode = 1;
}