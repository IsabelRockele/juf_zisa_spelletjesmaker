import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({
  base:'/tekenwereld/',
  plugins:[react(),tailwindcss()],
  resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
  build:{outDir:'../tekenwereld',emptyOutDir:true,rollupOptions:{input:{
    main:fileURLToPath(new URL('./index.html',import.meta.url)),
    join:fileURLToPath(new URL('./meedoen.html',import.meta.url))
  }}}
});
