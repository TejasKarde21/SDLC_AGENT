import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "url";

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  plugins: [react()],
  server: {
    port: 4173,
  },
});
