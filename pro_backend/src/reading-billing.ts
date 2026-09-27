/** Billing recipient is separate from the verified account that owns the subscription. */
export type ReadingBilling = {
  name:string; email:string; address:string; organization?:string; vatNumber?:string;
  peppolRequested?:boolean; peppolId?:string; gln?:string; purchaseReference?:string;
};
export function readingBilling(input:any, accountEmail:string):ReadingBilling {
  const clean=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';
  const peppolRequested=input?.peppolRequested===true;
  const email=clean(input?.billingEmail,254)||accountEmail;
  const result:ReadingBilling={name:clean(input?.name,120),address:clean(input?.address,250),
    organization:clean(input?.organization,120),vatNumber:clean(input?.vatNumber,40),email,
    peppolRequested,peppolId:peppolRequested?clean(input?.peppolId,100):'',
    gln:peppolRequested?clean(input?.gln,13):'',purchaseReference:clean(input?.purchaseReference,100)};
  if(!result.name || !result.address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Vul je naam, factuuradres en een geldig facturatie-e-mailadres in.');
  if(peppolRequested && (!result.organization || !/^\d{4}:[A-Za-z0-9._-]+$/.test(result.peppolId!)))throw new Error('Vul de schoolnaam en het volledige Peppol-ID in, bijvoorbeeld 0208: gevolgd door het ondernemingsnummer.');
  // Format/check-digit checks do not prove that a participant is registered on Peppol.
  const validGLN=(value:string)=>/^\d{13}$/.test(value) && [...value].reduce((sum,digit,index)=>sum+Number(digit)*(index%2?3:1),0)%10===0;
  if(result.gln && (!validGLN(result.gln) || String(input.gln).trim().length!==13))throw new Error('Vul een geldig GLN-nummer van 13 cijfers in.');
  if(result.peppolId?.startsWith('0088:')){
    const identifier=result.peppolId.slice(5);
    if(!validGLN(identifier) || (result.gln && result.gln!==identifier))throw new Error('Vul hetzelfde geldige GLN-nummer in als in het Peppol-ID.');
  }
  return result;
}
