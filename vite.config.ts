import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
       name: 'Grocery Store POS',
       short_name: 'Grocery POS',
       description: 'A simple grocery store POS system',
       theme_color: '#ffffff',
       icons: [
         {
           src: 'pwa-192x192.png',
           sizes: '192x192',
           type: 'image/png'
         },
         {
           src: 'pwa-512x512.png',
           sizes: '512x512',
           type: 'image/png' 
         },
         {
           src: 'pwa-512x512.png',
           sizes: '512x512',
           type: 'image/png',
           purpose: 'any maskable'
         },

       ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
