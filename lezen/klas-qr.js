/** Uses the bundled qrcode-generator API, not the unrelated QRCode constructor. */
export function renderClassQr(container,url){
  if(typeof window.qrcode!=='function')throw new Error('De QR-maker is niet geladen. Vernieuw deze pagina en probeer opnieuw.');
  const code=window.qrcode(0,'M');code.addData(url);code.make();
  const image=document.createElement('img');
  image.alt='Klas-QR: scan om Zisa Lezen te openen';
  image.src=code.createDataURL(5,20);
  image.width=image.height=(code.getModuleCount()+8)*5;
  image.style.maxWidth='100%';image.style.height='auto';
  container.replaceChildren(image);
}
