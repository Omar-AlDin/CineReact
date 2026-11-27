import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1", // Forces IPv4 and bypasses Windows 'localhost' DNS lookups
    port: 5173,
  },
});
