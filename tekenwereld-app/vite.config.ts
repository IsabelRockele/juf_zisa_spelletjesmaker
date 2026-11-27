import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {fileURLToPath} from 'node:url';
import {seasonalAssetHost} from './lib/seasonal-host';
export default defineConfig(({command,mode})=>{
  const env=loadEnv(mode,fileURLToPath(new URL('.',import.meta.url)),'VITE_');
  const assetHost=process.env.VITE_TEKENWERELD_SEIZOENEN_URL||env.VITE_TEKENWERELD_SEIZOENEN_URL||seasonalAssetHost;
  if(command==='build'&&!/^https?:\/\/[^\s]+$/.test(assetHost))throw new Error('Upload eerst de feestprenten naar Cloudflare Pages en stel het gecontroleerde adres in (lib/seasonal-host.ts).');
  return {
  base:'/tekenwereld/',
  plugins:[react(),tailwindcss()],
  resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
  build:{outDir:'../tekenwereld',emptyOutDir:true,rollupOptions:{input:{
    main:fileURLToPath(new URL('./index.html',import.meta.url)),
    join:fileURLToPath(new URL('./meedoen.html',import.meta.url))
  }}}
};});
