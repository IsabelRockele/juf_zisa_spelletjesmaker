// Local visual check of the real PDF renderer. No database or mail calls.
const fs=require('node:fs'),path=require('node:path');
const {readingPdf}=require('./lib/reading-invoice-store');
const {prepareReadingInvoice}=require('./lib/reading-invoice');
const {readingPeriod}=require('./lib/reading-ledger');
const source=fs.readFileSync(path.join(__dirname,'src/index.ts'),'utf8');
const sellerValue=name=>source.match(new RegExp('const '+name+'\\s*=\\s*"([^"]+)"'))[1];
const start=Date.parse('2026-09-27T12:00:00Z');
const invoice=prepareReadingInvoice({quantity:4,owner:{project:'zisa-spelletjesmaker-pro',uid:'visual-fixture'},customer:{name:'Voorbeeldschool',email:'voorbeeld@example.test',address:'Voorbeeldstraat 12, 1000 Brussel'},paidAt:new Date(start).toISOString(),period:readingPeriod(start,0),payment:{id:'tr_voorbeeld',mode:'test',status:'paid',customerId:'cst_voorbeeld',sequenceType:'first',amount:{currency:'EUR',value:'15.96'}}});
readingPdf(invoice,'TEST-VOORBEELD',{name:sellerValue('SELLER_NAME'),address:sellerValue('SELLER_ADDR1')+', '+sellerValue('SELLER_ADDR2'),email:sellerValue('SELLER_EMAIL'),enterprise:sellerValue('SELLER_ENTERPRISE'),vatText:sellerValue('SELLER_VAT_EXEMPT')}).then(pdf=>{
 const out=path.join(__dirname,'../output/pdf/factuur-zisa-lezen-school-voorbeeld.pdf');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,pdf);console.log('Local test PDF rendered; no invoice number allocated.');
});
