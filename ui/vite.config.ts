import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname),
  publicDir: path.resolve(__dirname, "public"),
  plugins: [react()],
  server: {
    port: 4173,
  },
});
