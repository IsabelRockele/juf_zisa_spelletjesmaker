import type { Firestore } from 'firebase-admin/firestore';
import type { Bucket } from '@google-cloud/storage';
import PDFDocument from 'pdfkit';
import { archiveReadingInvoice, ReadingInvoice } from './reading-invoice';
import { READING_COLLECTIONS } from './reading-service';

export type ReadingSeller = {name:string; address:string; email:string; enterprise:string; vatText:string};
export function readingPdf(invoice:ReadingInvoice, number:string, seller:ReadingSeller):Promise<Buffer> {
  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:'A4',margin:42});const chunks:Buffer[]=[];
    doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
    const text=(s:string,x:number,y:number,size=10,bold=false,width=500)=>doc.fillColor('#173f73').font(bold?'Helvetica-Bold':'Helvetica').fontSize(size).text(s,x,y,{width});
    doc.rect(0,0,595,100).fill('#173f73');doc.fillColor('white').font('Helvetica-Bold').fontSize(26).text('Zisa Lezen',42,30);
    doc.fontSize(17).text('TESTFACTUUR',365,34,{width:190,align:'right'});
    text('TEST - niet betalen en niet inboeken.',42,122,11,true);
    if(invoice.customer.peppolRequested)text('Nog via Peppol te versturen — gegevens op de volgende pagina.',42,142,10,true);
    text(seller.name,42,166,11,true,275);text(seller.address,42,187,10,false,275);text(seller.email,42,217,10,false,275);
    text(seller.enterprise,42,238,8,false,505);
    text(`Nummer: ${number}`,345,166,10,true,210);text(`Datum: ${new Date(invoice.issuedAt).toLocaleDateString('nl-BE',{timeZone:'Europe/Brussels'})}`,345,187,10,false,210);
    text(`Mollie: ${invoice.paymentId}`,345,207,9,false,210);
    text('AAN',42,280,9,true);text(invoice.customer.name,42,301,11,true);
    text([invoice.customer.organization,invoice.customer.address,invoice.customer.email,invoice.customer.vatNumber].filter(Boolean).join('\n'),42,322,10,false,505);
    doc.rect(42,430,511,27).fill('#173f73');doc.fillColor('white').font('Helvetica-Bold').text('Omschrijving',54,438);doc.text('Bedrag',480,438);
    const total='€ '+invoice.amountEUR.replace('.',',');
    text(invoice.description,54,472,10,true,385);text(total,473,478,12,true,80);
    text(`${invoice.quantity||1} × € ${(invoice.unitAmountEUR||'3.99').replace('.',',')} per maand`,54,490,9,false,405);
    const format=(n:number)=>new Date(n).toLocaleDateString('nl-BE',{timeZone:'Europe/Brussels'});
    text(`Leesrecht van ${format(invoice.period.start)} tot ${format(invoice.period.end)}`,54,518,10,false,440);
    text(`Totaal betaald: ${total}`,330,560,15,true,223);
    text(invoice.renewalText,42,613,10,false,505);
    text('Na opzegging blijft de betaalde leesperiode beschikbaar.',42,650,10);
    text(seller.vatText,42,702,8,false,505);
    text(`${seller.name} | ${seller.email}`,42,788,8,false,505);
    if(invoice.customer.peppolRequested){
      doc.addPage();
      doc.fillColor('#173f73').font('Helvetica-Bold').fontSize(20).text('Peppolgegevens',42,42);
      doc.fontSize(12).text(`Bij factuur ${number}`,42,78);
      doc.font('Helvetica').fontSize(11).text('Nog via Peppol te versturen. Gebruik dezelfde factuur en hetzelfde factuurnummer. Deze PDF is geen bewijs van verzending via Peppol.',42,112,{width:505});
      const c=invoice.customer;
      doc.moveDown().text([
        `School: ${c.organization||c.name}`, `Naam: ${c.name}`, `Adres: ${c.address}`,
        `E-mail: ${c.email}`, `Peppol-ID: ${c.peppolId||''}`,
        `Ondernemingsnummer: ${c.vatNumber||'niet opgegeven'}`, `GLN-nummer: ${c.gln||'niet opgegeven'}`,
        `Bestelreferentie: ${c.purchaseReference||'niet opgegeven'}`,
      ].join('\n\n'),{width:505});
    }
    doc.end();
  });
}

/** Same central TEST counter and archive as Pro. No write to licenses or production mail. */
export function readingInvoiceStore(db:Firestore,bucket:Bucket,seller:ReadingSeller) {
  return async (invoice:ReadingInvoice)=>{
    const record=db.collection(READING_COLLECTIONS.invoices).doc(invoice.key);
    const result=await archiveReadingInvoice(invoice,{
      reserve:async value=>db.runTransaction(async tx=>{
        const snap=await tx.get(record);if(snap.exists)return {number:snap.data()!.number,snapshot:snap.data()!.snapshot,storageYear:snap.data()!.storageYear,archivePath:snap.data()!.path || snap.data()!.archivePath || `Facturen/test/${snap.data()!.storageYear}/${snap.data()!.number}.pdf`};
        const counter=db.doc('counters/test_invoice_seq');const seq=await tx.get(counter);
        const issuedAt=new Date();const snapshot={...value,issuedAt:issuedAt.toISOString()};
        const year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Europe/Brussels'}).format(issuedAt));const next=seq.data()?.year===year?seq.data()!.next:1;
        const number=`TEST-${String(next||1).padStart(4,'0')}`;
        tx.set(counter,{year,next:(next||1)+1});
        const archivePath=`Facturen/test/Zisa Lezen/${year}/factuur-zisa-lezen-${number}.pdf`;
        tx.create(record,{archivePath,number,snapshot,ownerKey:value.ownerKey,ready:false,storageYear:year,
          peppolStatus:value.customer.peppolRequested?'pending_manual':'not_requested'});
        return {number,snapshot,storageYear:year,archivePath};
      }),
      render:(value,number)=>readingPdf(value,number,seller),
      archive:async(path,pdf)=>{
        try {await bucket.file(path).save(pdf,{resumable:false,contentType:'application/pdf',preconditionOpts:{ifGenerationMatch:0},metadata:{cacheControl:'private, no-store'}});}
        catch(error){if(Number((error as any).code)!==412)throw error;}
      },
      enqueue:async(key,job)=>{
        const ref=db.collection(READING_COLLECTIONS.outbox).doc(key);
        await db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)tx.create(ref,{...job,kind:'invoice',sent:false,createdAt:Date.now(),deliveryEnabled:false});});
      },
    });
    await record.update({ready:true,path:result.path});
  };
}
