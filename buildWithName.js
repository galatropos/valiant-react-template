/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';

const distPath = path.resolve(process.cwd(), 'dist');
const oldFile = path.join(distPath, 'index.html');
const bundleName = process.env.VITE_BUNDLE_NAME ? process.env.VITE_BUNDLE_NAME + '.html' : 'bundle.html';
const newFile = path.join(distPath, bundleName);

fs.rename(oldFile, newFile, (err) => {
  if (err) {
    console.error('❌ Error renombrando archivo:', err);
    process.exit(1);
  } else {
    console.log(`✅ Archivo renombrado a ${bundleName}`);
  }
});