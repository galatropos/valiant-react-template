import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const baseConfig = {
    plugins: [react(), viteSingleFile()], // ✅ quitado viteCompression()
    resolve: {
      alias: {
        "@assets": path.resolve(__dirname, "src/assets"),
        "@component": path.resolve(__dirname, "src/component"),
        "@context": path.resolve(__dirname, "src/context"),
        "@hook": path.resolve(__dirname, "src/hook"),
        "@utils": path.resolve(__dirname, "src/utils"),
      },
    },
    build: {
      assetsInlineLimit: 4096,
      minify: "esbuild",
    },
    esbuild: {
    },
  };

  if (mode === "temp") {
    return {
      ...baseConfig,
      build: { ...baseConfig.build, outDir: "dist/temp" },
    };
  }

  return {
    ...baseConfig,
    build: { ...baseConfig.build, outDir: "dist" },
  };
});
