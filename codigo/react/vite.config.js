import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// publicDir: las fotos y videos siguen viviendo en la carpeta "imagenes" de la raíz del proyecto.
export default defineConfig({
  plugins: [react()],
  base: "./",
  publicDir: "../../imagenes",
});