// Runs real authenticated HTTP handlers inside one PostgreSQL transaction;
// all fixture data is rolled back, including audits and generated QR documents.
require('dotenv').config();
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const clientPath = require.resolve('@prisma/client');
const originalClient = require(clientPath);
const prisma = new originalClient.PrismaClient();
const rollback = new Error('ROLLBACK_RECONCILIATION_TEST');
let server;
async function main() {
  let checks = 0;
  try {
    await prisma.$transaction(async tx => {
      const user = await tx.user.findFirst({ where: { role: 'SUPER_ADMIN' } }); assert.ok(user, 'Super admin lokal diperlukan');
      const category = await tx.kategoriKeuangan.findFirst(); const account = await tx.akunKas.findFirst({where:{isAktif:true}}); assert.ok(category && account);
      const tag = `RECON-TEST-${Date.now()}`;
      const qr = await tx.qrDocument.create({data:{id:BigInt(Date.now()),token:tag,nomorSurat:tag,keteranganSurat:'Uji arsip',tanggal:new Date(),namaPejabat:'Pejabat 1',jabatan:'Ketua',namaPejabat2:'Pejabat 2',jabatan2:'Bendahara'}});
      const rab = await tx.rencanaAnggaran.create({data:{nomorRab:tag,namaKegiatan:tag,penanggungJawab:'Uji',tanggalMulai:new Date('2026-08-01'),tanggalSelesai:new Date('2026-09-30'),totalDiajukan:10000000,totalDisetujui:10000000,status:'SELESAI',createdById:user.id,lpjQrDocumentId:qr.id,closedAt:new Date(),items:{create:{uraian:'Komponen awal',volume:1,satuan:'paket',hargaSatuan:10000000,jumlahDiajukan:10000000,jumlahDisetujui:10000000,kategoriId:category.id}},pencairans:{create:{akunKasId:account.id,tanggal:new Date('2026-08-10'),nominal:10000000,sumberDana:'Bendahara',createdById:user.id}},pengeluarans:{create:{akunKasId:account.id,kategoriId:category.id,tanggal:new Date('2026-08-11'),nominal:10000000,uraian:'Realisasi awal',metode:'TRANSFER',status:'VERIFIKASI',createdById:user.id}}},include:{items:true}});
      const proxy = new Proxy(tx,{get(target,key){if(key==='$transaction')return async fn=>typeof fn==='function'?fn(proxy):Promise.all(fn);if(key==='$disconnect')return async()=>{};return target[key];}});
      require.cache[clientPath].exports={...originalClient,PrismaClient:class{constructor(){return proxy;}}};
      const app = require('../src/app'); server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
      const base=`http://127.0.0.1:${server.address().port}/api/keuangan`;
      const call=async(method,path,body,expected=200,role='SUPER_ADMIN')=>{
        const token=jwt.sign({id:user.id,role},process.env.JWT_SECRET,{expiresIn:'5m'});
        const response=await fetch(base+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
        const result=await response.json();assert.equal(response.status,expected,`${method} ${path}: ${JSON.stringify(result)}`);checks++;return result.data;
      };
      await call('POST',`/rab/${rab.id}/reopen`,{alasan:'Dana punia tambahan'},403,'ADMIN');
      await call('POST',`/rab/${rab.id}/reopen`,{alasan:''},400);
      await call('POST',`/rab/${rab.id}/pencairan`,{nominal:2000000,akunKasId:account.id,tanggal:'2026-09-01',jenisSumber:'PUNIA'},409);
      await call('POST',`/rab/${rab.id}/reopen`,{alasan:'Dana punia tambahan'});
      const detail=await call('GET',`/rab/${rab.id}`);assert.equal(detail.revision,2);assert.equal(detail.lpjQrDocumentId,null);assert.equal(detail.arsips.length,1);
      const snapshot=await call('GET',`/rab/${rab.id}/arsip/${detail.arsips[0].id}`);assert.equal(snapshot.status,'SELESAI');assert.equal(snapshot.lpjQrDocument.token,tag);
      await call('POST',`/rab/${rab.id}/pencairan`,{nominal:-1,akunKasId:account.id,tanggal:'2026-09-01'},400);
      await call('POST',`/rab/${rab.id}/pencairan`,{nominal:2000000,akunKasId:account.id,tanggal:'2026-09-01',jenisSumber:'PUNIA',sumberDana:'Donatur'},201,'ADMIN');
      let current=await call('GET',`/rab/${rab.id}`);assert.equal(current.ringkasan.sisaKas,0);assert.equal(current.ringkasan.penerimaanMenunggu,2000000);
      const receipt=current.pencairans.find(r=>r.jenisSumber==='PUNIA');
      await call('POST',`/rab/${rab.id}/submit-lpj`,{},409);
      await call('POST',`/pencairan/${receipt.id}/verify`,{},403,'ADMIN');
      await call('POST',`/pencairan/${receipt.id}/verify`,{});
      await call('POST',`/pencairan/${receipt.id}/verify`,{},409);
      const proposal={alasan:'Komponen tambahan disetujui',items:[{uraian:'Tambahan konsumsi',volume:1,satuan:'paket',hargaSatuan:1500000,kategoriId:category.id}]};
      await call('POST',`/rab/${rab.id}/penyesuaian-anggaran`,proposal,200,'ADMIN');
      current=await call('GET',`/rab/${rab.id}`);assert.equal(Number(current.totalDisetujui),10000000);assert.equal(current.ringkasan.sisaKas,2000000);
      const pending=current.perubahanAnggarans[0];
      await call('POST',`/penyesuaian-anggaran/${pending.id}/decision`,{status:'DISETUJUI',alasan:'Komponen disetujui'},403,'ADMIN');
      await call('POST',`/penyesuaian-anggaran/${pending.id}/decision`,{status:'DISETUJUI',alasan:'Komponen disetujui'});
      current=await call('GET',`/rab/${rab.id}`);assert.equal(Number(current.totalDisetujui),11500000);assert.equal(current.status,'DALAM_PENYESUAIAN');
      await call('POST',`/rab/${rab.id}/sign-rab`,{namaPejabat:'Revisi 1',jabatan:'Ketua',namaPejabat2:'Revisi 2',jabatan2:'Bendahara'});
      await call('POST',`/rab/${rab.id}/pengeluaran`,{nominal:1500000,akunKasId:account.id,kategoriId:category.id,itemAnggaranId:current.items[1].id,tanggal:'2026-09-03',uraian:'Konsumsi tambahan',metode:'TRANSFER'},201,'ADMIN');
      current=await call('GET',`/rab/${rab.id}`);const expense=current.pengeluarans.find(e=>e.status==='MENUNGGU_VERIFIKASI');
      await call('POST',`/pengeluaran/${expense.id}/verify`,{});
      await call('POST',`/rab/${rab.id}/pengembalian`,{nominal:500000,akunKasId:account.id,tanggal:'2026-09-04'},201);
      await call('POST',`/rab/${rab.id}/submit-lpj`,{});
      await call('POST',`/rab/${rab.id}/close`,{lpjQrDocumentId:String(qr.id)},400);
      await call('POST',`/rab/${rab.id}/close`,{namaPejabat:'Baru 1',jabatan:'Ketua',namaPejabat2:'Baru 2',jabatan2:'Bendahara'});
      current=await call('GET',`/rab/${rab.id}`);assert.equal(current.status,'SELESAI');assert.equal(current.ringkasan.sisaKas,0);assert.notEqual(current.lpjQrDocumentId,String(qr.id));
      const report=await call('GET','/rekonsiliasi?dari=2026-09-01&sampai=2026-09-30');const row=report.rows.find(r=>r.id===rab.id);assert.equal(row.punia,2000000);assert.equal(row.realisasi,1500000);assert.equal(row.pengembalian,500000);assert.equal(row.sisaDana,0);
      await call('POST','/rekonsiliasi/kas',{akunKasId:account.id,tanggal:'2026-09-30',saldoAktual:0,alasan:'Pemeriksaan data uji'});
      await call('GET','/rekonsiliasi/kas');
      const stillArchived=await call('GET',`/rab/${rab.id}/arsip/${detail.arsips[0].id}`);assert.equal(stillArchived.ringkasan.danaMasuk,10000000);
      const ExcelJS=require('exceljs');
      for(const path of ['/rekonsiliasi/export.xlsx?dari=2026-09-01&sampai=2026-09-30',`/rab/${rab.id}/export.xlsx?arsip=${detail.arsips[0].id}`]) {
        const token=jwt.sign({id:user.id,role:'SUPER_ADMIN'},process.env.JWT_SECRET,{expiresIn:'5m'});
        const response=await fetch(base+path,{headers:{Authorization:`Bearer ${token}`}});assert.equal(response.status,200);
        const book=new ExcelJS.Workbook();await book.xlsx.load(Buffer.from(await response.arrayBuffer()));assert.ok(book.worksheets.length>=2);checks++;
        if(path.includes('arsip')) assert.equal(book.getWorksheet('Dana Masuk').rowCount,2,'Arsip harus berisi satu pencairan awal saja');
        else { const sheet=book.getWorksheet('Rekonsiliasi RAB');let found=false;sheet.eachRow(row=>{if(row.getCell(1).value===tag){assert.equal(row.getCell(8).value,2000000);assert.equal(row.getCell(13).value,0);found=true;}});assert.ok(found); }
      }
      throw rollback;
    },{timeout:60000});
  }catch(e){if(e!==rollback)throw e;}
  finally{require.cache[clientPath].exports=originalClient;if(server)await new Promise(resolve=>server.close(resolve));await prisma.$disconnect();}
  console.log(`Reconciliation HTTP smoke passed (${checks} requests); all test data rolled back.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
