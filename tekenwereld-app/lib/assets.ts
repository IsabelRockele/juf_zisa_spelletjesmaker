/// <reference types="vite/client" />
import {seasonalAssetHost} from './seasonal-host';
// Fill this build setting only with the verified Cloudflare Pages deployment.
// Original worlds retain their existing paths and original files.
const seasonalBase = (import.meta.env.VITE_TEKENWERELD_SEIZOENEN_URL || seasonalAssetHost).replace(/\/+$/, '');
const seasonalIds = new Set(['sint','kerst','pasen']);
function seasonalAsset(file:string){
  if(!seasonalBase)throw new Error('De prenten voor de feestwerelden zijn nog niet gekoppeld.');
  return `${seasonalBase}/${file}`;
}
export function templateImage(id:string){
  return seasonalIds.has(id.split('-')[0]) ? seasonalAsset(`${id}.png`) : `/tekenwereld/art/${id}.png`;
}
export function sceneImage(world:string){
  return seasonalIds.has(world) ? seasonalAsset(`scene-${world}.png`) : `/tekenwereld/art/scene-${world}.jpg`;
}
