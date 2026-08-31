import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, CheckCircle2, Download, Eye, FileCheck2, FileSpreadsheet, FileText, Landmark, Plus, Receipt, RotateCcw, Send, Upload, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../../../lib/axios';
import { formatDate, formatRupiah, StatusRabBadge } from '../../../lib/finance';
import useAuthStore from '../../../store/authStore';
import useFileUrl from '../../../hooks/useFileUrl';

const inputClass = 'w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500';
const today = () => new Date().toISOString().slice(0, 10);

const Summary = ({ icon: Icon, label, value, tone }) => <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className={`mb-3 inline-flex rounded-lg p-2 ${tone}`}><Icon size={18}/></div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-slate-800">{formatRupiah(value)}</p></div>;

export default function RabDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const treasurer = ['BENDAHARA', 'SUPER_ADMIN'].includes(user?.role);
  const [rab, setRab] = useState(null);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [verificationDocuments, setVerificationDocuments] = useState([]);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    try {
      const [rabRes, catRes, accountRes, programRes, verificationRes] = await Promise.all([api.get(`/keuangan/rab/${id}`), api.get('/keuangan/kategori'), api.get('/keuangan/akun-kas'), api.get('/program-ajahan'), api.get('/keuangan/verification-documents')]);
      setRab(rabRes.data.data); setCategories(catRes.data.data.filter((r)=>r.isAktif)); setAccounts(accountRes.data.data.filter((r)=>r.isAktif)); setPrograms((programRes.data.data||programRes.data||[]).filter((r)=>r.isAktif!==false)); setVerificationDocuments(verificationRes.data.data||[]);
    } catch (error) { toast.error(error.response?.data?.message || 'Gagal memuat detail RAB'); }
  };
  useEffect(() => { load(); }, [id]);

  const action = async (path, body = {}) => {
    setSaving(true); try { const res = await api.post(path, body); toast.success(res.data.message); setModal(null); setForm({}); await load(); } catch (error) { toast.error(error.response?.data?.message || 'Proses gagal'); } finally { setSaving(false); }
  };
  const submitTransaction = async (kind) => {
    setSaving(true);
    try {
      const payload = new FormData(); Object.entries(form).forEach(([key,value]) => { if (value !== '' && value !== null && value !== undefined) payload.append(key,value); });
      const endpoint = kind === 'pencairan' ? `/keuangan/rab/${id}/pencairan` : kind === 'pengeluaran' ? `/keuangan/rab/${id}/pengeluaran` : `/keuangan/rab/${id}/pengembalian`;
      const res = await api.post(endpoint, payload); toast.success(res.data.message); setModal(null); setForm({}); await load();
    } catch (error) { toast.error(error.response?.data?.message || 'Gagal menyimpan transaksi'); } finally { setSaving(false); }
  };
  const saveDraft = async () => {
    setSaving(true);
    try {
      const payload = new FormData();
      ['namaKegiatan','nomorReferensi','programAjahanId','penanggungJawab','tujuan','tanggalMulai','tanggalSelesai','catatan'].forEach((key) => payload.append(key, form[key] || ''));
      payload.append('rabQrDocumentId', form.rabQrDocumentId === undefined ? (rab.rabQrDocumentId || '') : form.rabQrDocumentId);
      payload.append('items', JSON.stringify(form.items));
      if (form.dokumen) payload.append('dokumen', form.dokumen);
      const res = await api.patch(`/keuangan/rab/${id}`, payload); toast.success(res.data.message); setModal(null); setForm({}); await load();
    } catch (error) { toast.error(error.response?.data?.message || 'Gagal memperbarui draft'); } finally { setSaving(false); }
  };

  const saveMetadata = async () => {
    if (!form.alasanPerubahan?.trim()) {
      toast.error('Alasan perubahan wajib diisi untuk kebutuhan audit.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch(`/keuangan/rab/${id}/metadata`, form);
      toast.success(res.data.message);
      setModal(null); setForm({}); await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui informasi RAB/LPJ');
    } finally { setSaving(false); }
  };

  const saveExpenseVerification = async (verifyAfter = false) => {
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (!['targetId', 'existingBuktiPath'].includes(key) && value !== '' && value !== null && value !== undefined) payload.append(key, value);
      });
      const updated = await api.patch(`/keuangan/pengeluaran/${form.targetId}`, payload);
      toast.success(updated.data.message);
      if (verifyAfter) {
        const verified = await api.post(`/keuangan/pengeluaran/${form.targetId}/verify`);
        toast.success(verified.data.message);
      }
      setModal(null); setForm({}); await load();
    } catch (error) { toast.error(error.response?.data?.message || 'Gagal memproses verifikasi pengeluaran'); }
    finally { setSaving(false); }
  };

  const downloadExcel = async () => {
    try { const res = await api.get(`/keuangan/rab/${id}/export.xlsx`, { responseType: 'blob' }); const url = URL.createObjectURL(res.data); const link = document.createElement('a'); link.href=url; link.download=`LPJ-${rab.nomorRab.replaceAll('/','-')}.xlsx`; link.click(); URL.revokeObjectURL(url); } catch { toast.error('Gagal mengunduh Excel'); }
  };
  const uploadEvidence = async (endpoint, file) => {
    if (!file) return;
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('bukti', file);
      const res = await api.patch(endpoint, payload);
      toast.success(res.data.message);
      await load();
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.message || error.message;
      toast.error(status ? `Gagal mengunggah berkas: ${detail}` : 'Gagal mengunggah berkas: backend tidak dapat dihubungi');
    }
    finally { setSaving(false); }
  };
  const exportPdf = async () => {
    const isLpj = ['REALISASI', 'MENUNGGU_VERIFIKASI_LPJ', 'PERLU_REVISI', 'SELESAI'].includes(rab.status);
    const verification = rab.status === 'SELESAI' ? rab.lpjQrDocument : rab.rabQrDocument;
    const documentLabel = isLpj ? 'LAPORAN PERTANGGUNGJAWABAN DANA' : 'RENCANA ANGGARAN BIAYA';
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let headerLogo = null;
    try { headerLogo = new Image(); headerLogo.src='/logo.png'; await new Promise((resolve,reject)=>{headerLogo.onload=resolve;headerLogo.onerror=reject;}); } catch { headerLogo = null; }
    const shorten = (value, limit = 105) => String(value || '').length > limit ? `${String(value).slice(0, limit - 3)}...` : String(value || '');
    const drawHeader = (title, subtitle) => {
      doc.setFillColor(20, 83, 45); doc.rect(0, 0, 210, 32, 'F');
      if (headerLogo) doc.addImage(headerLogo,'PNG',14,6,20,20);
      doc.setTextColor(255); doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.text(title,40,14);
      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.text(shorten(subtitle),40,21,{maxWidth:155});
    };
    const addAttachmentPage = (imageData, imageWidth, imageHeight, attachment, pageLabel = '') => {
      doc.addPage();
      drawHeader('LAMPIRAN BUKTI TRANSAKSI', `${attachment.label} - ${attachment.detail}${pageLabel}`);
      const maxWidth = 182; const maxHeight = 232; const ratio = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
      const width = imageWidth * ratio; const height = imageHeight * ratio;
      const x = (210 - width) / 2; const y = 39 + (maxHeight - height) / 2;
      const format = typeof imageData === 'string' && imageData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(imageData,format,x,y,width,height,undefined,'FAST');
    };
    drawHeader(documentLabel,`${rab.nomorRab} - ${rab.namaKegiatan}`);
    doc.setTextColor(35,45,55); doc.setFontSize(9);
    autoTable(doc,{startY:38,margin:{top:38,bottom:20},theme:'plain',styles:{fontSize:9,cellPadding:1.8},columnStyles:{0:{fontStyle:'bold',cellWidth:42},1:{cellWidth:145}},body:[['No. Referensi',rab.nomorReferensi||'-'],['Program Ajahan',rab.programAjahan?.nama||'Umum'],['Penanggung Jawab',rab.penanggungJawab],['Periode',`${formatDate(rab.tanggalMulai)} s.d. ${formatDate(rab.tanggalSelesai)}`],['Status',rab.status]]});
    let y=doc.lastAutoTable.finalY+5;
    autoTable(doc,{startY:y,margin:{top:38,bottom:20},theme:'grid',head:[['Dana Disetujui','Dana Masuk','Realisasi','Dikembalikan','Sisa Kas']],body:[[formatRupiah(rab.totalDisetujui),formatRupiah(rab.ringkasan.danaMasuk),formatRupiah(rab.ringkasan.pengeluaranTerverifikasi),formatRupiah(rab.ringkasan.danaDikembalikan),formatRupiah(rab.ringkasan.sisaKas)]],headStyles:{fillColor:[22,101,52],fontSize:8},styles:{fontSize:8,halign:'right'}});
    y=doc.lastAutoTable.finalY+7; doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text('Rincian Anggaran dan Realisasi',14,y);
    autoTable(doc,{startY:y+3,margin:{top:38,bottom:20},head:[['No','Uraian','Kategori','Disetujui','Realisasi','Sisa']],body:rab.items.map((item,i)=>{const real=rab.pengeluarans.filter(e=>e.itemAnggaranId===item.id&&e.status==='VERIFIKASI').reduce((t,e)=>t+Number(e.nominal),0);return[i+1,item.uraian,item.kategori?.nama||'-',formatRupiah(item.jumlahDisetujui),formatRupiah(real),formatRupiah(Number(item.jumlahDisetujui)-real)];}),headStyles:{fillColor:[30,41,59]},styles:{fontSize:7.5},columnStyles:{0:{cellWidth:9},1:{cellWidth:55},2:{cellWidth:32},3:{halign:'right'},4:{halign:'right'},5:{halign:'right'}}});
    y=doc.lastAutoTable.finalY+7; doc.setFontSize(11); doc.text('Detail Pengeluaran',14,y);
    autoTable(doc,{startY:y+3,margin:{top:38,bottom:20},head:[['No','Tanggal','Kategori / Uraian','Penerima','No. Bukti','Status','Nominal']],body:rab.pengeluarans.map((e,i)=>[i+1,formatDate(e.tanggal),`${e.kategori.nama}\n${e.uraian}`,e.penerima||'-',e.nomorBukti||'-',e.status,formatRupiah(e.nominal)]),headStyles:{fillColor:[30,41,59]},styles:{fontSize:7},columnStyles:{0:{cellWidth:8},1:{cellWidth:20},2:{cellWidth:48},3:{cellWidth:28},4:{cellWidth:22},5:{cellWidth:28},6:{halign:'right'}}});
    if (verification) {
      y = doc.lastAutoTable.finalY + 12;
      if (y > 225) { doc.addPage(); y = 42; }
      doc.setTextColor(35,45,55); doc.setFontSize(8); doc.setFont('helvetica','normal');
      doc.text(verification.jabatan, 45, y, { align:'center', maxWidth:55 });
      doc.text(verification.jabatan2 || '-', 165, y, { align:'center', maxWidth:55 });
      const qrCanvas = document.getElementById(`finance-qr-${verification.token}`);
      if (qrCanvas) doc.addImage(qrCanvas.toDataURL('image/png'), 'PNG', 92, y - 3, 26, 26);
      doc.setFont('helvetica','bold'); doc.setFontSize(9);
      doc.text(verification.namaPejabat, 45, y + 27, { align:'center', maxWidth:58 });
      doc.text(verification.namaPejabat2 || '-', 165, y + 27, { align:'center', maxWidth:58 });
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(90);
      doc.text(`Verifikasi: ${verification.token}`,105,y+27,{align:'center'});
      doc.text(formatDate(verification.tanggal),105,y+31,{align:'center'});
    }
    const reportPageCount = doc.getNumberOfPages();
    let attachmentFailures = 0;
    let pdfjs = null;
    for (const attachment of attachments.filter((item)=>item.path && item.includeInPdf !== false)) {
      try {
        const filename = encodeURIComponent(attachment.path.split('/').pop());
        const response = await api.get(`/keuangan/files/${filename}`, { responseType:'arraybuffer' });
        if (attachment.path.toLowerCase().endsWith('.pdf')) {
          if (!pdfjs) {
            pdfjs = await import('pdfjs-dist');
            const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
            pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
          }
          const sourcePdf = await pdfjs.getDocument({ data:new Uint8Array(response.data) }).promise;
          for (let pageNumber=1;pageNumber<=sourcePdf.numPages;pageNumber+=1) {
            const sourcePage = await sourcePdf.getPage(pageNumber);
            const viewport = sourcePage.getViewport({ scale:1.6 });
            const canvas = document.createElement('canvas'); canvas.width=viewport.width; canvas.height=viewport.height;
            await sourcePage.render({ canvasContext:canvas.getContext('2d'), viewport }).promise;
            addAttachmentPage(canvas.toDataURL('image/jpeg',0.9),canvas.width,canvas.height,attachment,` - halaman ${pageNumber} dari ${sourcePdf.numPages}`);
            canvas.width=0; canvas.height=0;
          }
          sourcePdf.destroy();
        } else {
          const mimeType = response.headers['content-type'] || (attachment.path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
          const dataUrl = await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(new Blob([response.data],{type:mimeType}));});
          const image = new Image(); image.src=dataUrl; await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;});
          addAttachmentPage(dataUrl,image.naturalWidth,image.naturalHeight,attachment);
        }
      } catch (error) {
        attachmentFailures += 1;
        console.error('Gagal menambahkan lampiran bukti:', attachment.path, error);
      }
    }
    const disclaimer='Dokumen ini ditandatangani secara elektronik menggunakan verifikasi QR-Code terenkripsi sistem. Informasi di atas adalah mutlak benar dan sesuai dengan data resmi terverifikasi secara elektronik di dalam server PDPN.';
    const pageCount=doc.getNumberOfPages(); for(let page=1;page<=pageCount;page++){doc.setPage(page);if(page<=reportPageCount)drawHeader(documentLabel,`${rab.nomorRab} - ${rab.namaKegiatan}`);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(110);doc.text(`Dicetak dari Vidya • Halaman ${page} dari ${pageCount}`,105,283,{align:'center'});doc.setFontSize(6.2);doc.text(doc.splitTextToSize(disclaimer,180),105,288,{align:'center',lineHeightFactor:1.15});}
    doc.save(`${isLpj?'LPJ':'RAB'}-${rab.nomorRab.replaceAll('/','-')}.pdf`);
    if (attachmentFailures) toast.warning(`${attachmentFailures} berkas lampiran tidak dapat dimuat ke PDF.`);
  };

  if (!rab) return <div className="flex min-h-[50vh] items-center justify-center text-slate-400">Memuat detail RAB...</div>;
  const open = (name, defaults={}) => { setForm(defaults); setModal(name); };
  const canSpend = ['DICAIRKAN_SEBAGIAN','DICAIRKAN_PENUH','REALISASI','PERLU_REVISI'].includes(rab.status);
  const approvalVerification = String(rab.rabQrDocumentId || '') === String(form.rabQrDocumentId || '')
    ? rab.rabQrDocument
    : verificationDocuments.find((document) => String(document.id) === String(form.rabQrDocumentId || ''));
  const lpjVerification = String(rab.lpjQrDocumentId || '') === String(form.lpjQrDocumentId || '')
    ? rab.lpjQrDocument
    : verificationDocuments.find((document) => String(document.id) === String(form.lpjQrDocumentId || ''));
  const attachments = [
    { path: rab.dokumenPath, label: 'Dokumen Pendukung RAB', detail: rab.nomorReferensi || rab.nomorRab, endpoint: `/keuangan/rab/${rab.id}/dokumen`, includeInPdf: false },
    ...rab.pencairans.map((row) => ({ path: row.buktiPath, label: 'Bukti Dana Masuk', detail: `${formatDate(row.tanggal)} · ${formatRupiah(row.nominal)}${row.nomorReferensi ? ` · ${row.nomorReferensi}` : ''}`, endpoint: `/keuangan/pencairan/${row.id}/bukti` })),
    ...rab.pengeluarans.map((row) => ({ path: row.buktiPath, label: 'Bukti Pengeluaran', detail: `${row.uraian} · ${formatRupiah(row.nominal)}`, endpoint: `/keuangan/pengeluaran/${row.id}/bukti` })),
    ...rab.pengembalians.map((row) => ({ path: row.buktiPath, label: 'Bukti Pengembalian Dana', detail: `${formatDate(row.tanggal)} · ${formatRupiah(row.nominal)}${row.nomorReferensi ? ` · ${row.nomorReferensi}` : ''}`, endpoint: `/keuangan/pengembalian/${row.id}/bukti` }))
  ];
  const approveRabAction = () => {
    if (!approvalVerification && ['namaPejabat','jabatan','namaPejabat2','jabatan2'].some((key) => !form[key]?.trim())) {
      toast.error('Pilih Verifikasi Dokumen atau lengkapi nama dan jabatan kedua penandatangan.');
      return;
    }
    action(`/keuangan/rab/${id}/approve`, {
      ...form,
      rabQrDocumentId: approvalVerification?.id || form.rabQrDocumentId || undefined,
      rabQrDocumentToken: approvalVerification?.token || undefined,
      ...(approvalVerification ? {
        namaPejabat: approvalVerification.namaPejabat,
        jabatan: approvalVerification.jabatan,
        namaPejabat2: approvalVerification.namaPejabat2,
        jabatan2: approvalVerification.jabatan2
      } : {})
    });
  };
  const submitLpjSignature = (endpoint) => {
    if (!lpjVerification && ['namaPejabat','jabatan','namaPejabat2','jabatan2'].some((key) => !form[key]?.trim())) {
      toast.error('Pilih Verifikasi Dokumen atau lengkapi nama dan jabatan kedua penandatangan.');
      return;
    }
    action(endpoint, {
      ...form,
      lpjQrDocumentId: lpjVerification?.id || form.lpjQrDocumentId || undefined,
      lpjQrDocumentToken: lpjVerification?.token || undefined,
      ...(lpjVerification ? {
        namaPejabat: lpjVerification.namaPejabat,
        jabatan: lpjVerification.jabatan,
        namaPejabat2: lpjVerification.namaPejabat2,
        jabatan2: lpjVerification.jabatan2
      } : {})
    });
  };
  const closeLpjAction = () => submitLpjSignature(`/keuangan/rab/${id}/close`);
  const signCompletedLpjAction = () => submitLpjSignature(`/keuangan/rab/${id}/sign-lpj`);

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><Link to="/admin/keuangan/rab" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-emerald-700"><ArrowLeft size={16}/> Kembali ke RAB</Link><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-black text-slate-800">{rab.namaKegiatan}</h1><StatusRabBadge status={rab.status}/></div><p className="mt-1 text-sm text-slate-500">{rab.nomorRab} · {rab.programAjahan?.nama||'Kegiatan Umum'} · Revisi {rab.revision}</p>{rab.nomorReferensi&&<p className="mt-1 text-xs font-semibold text-emerald-700">Referensi surat: {rab.nomorReferensi}</p>}</div><div className="flex flex-wrap gap-2"><button onClick={exportPdf} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"><Download size={17}/> PDF</button><button onClick={downloadExcel} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"><FileSpreadsheet size={17}/> Excel</button></div></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"><Summary icon={FileCheck2} label="Anggaran Disetujui" value={rab.totalDisetujui} tone="bg-blue-50 text-blue-600"/><Summary icon={Banknote} label="Dana Masuk" value={rab.ringkasan.danaMasuk} tone="bg-cyan-50 text-cyan-600"/><Summary icon={Receipt} label="Realisasi" value={rab.ringkasan.pengeluaranTerverifikasi} tone="bg-violet-50 text-violet-600"/><Summary icon={RotateCcw} label="Dikembalikan" value={rab.ringkasan.danaDikembalikan} tone="bg-amber-50 text-amber-600"/><Summary icon={Wallet} label="Sisa Kas" value={rab.ringkasan.sisaKas} tone="bg-emerald-50 text-emerald-600"/></div>

    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-slate-800">Alur Persetujuan</h2><p className="text-xs text-slate-500">Aksi yang tersedia menyesuaikan status dan role Anda.</p></div><div className="flex flex-wrap gap-2">
      {['DRAFT','DITOLAK'].includes(rab.status)&&<button onClick={()=>open('edit',{namaKegiatan:rab.namaKegiatan,nomorReferensi:rab.nomorReferensi||'',programAjahanId:rab.programAjahanId||'',penanggungJawab:rab.penanggungJawab,tujuan:rab.tujuan||'',tanggalMulai:new Date(rab.tanggalMulai).toISOString().slice(0,10),tanggalSelesai:new Date(rab.tanggalSelesai).toISOString().slice(0,10),catatan:rab.catatan||'',items:rab.items.map(i=>({kategoriId:i.kategoriId||'',uraian:i.uraian,volume:Number(i.volume),satuan:i.satuan,hargaSatuan:Number(i.hargaSatuan)}))})} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">Edit Draft</button>}
      {treasurer&&!['DRAFT','DITOLAK'].includes(rab.status)&&<button onClick={()=>open('edit-metadata',{namaKegiatan:rab.namaKegiatan,nomorReferensi:rab.nomorReferensi||'',programAjahanId:rab.programAjahanId||'',penanggungJawab:rab.penanggungJawab,tujuan:rab.tujuan||'',tanggalMulai:new Date(rab.tanggalMulai).toISOString().slice(0,10),tanggalSelesai:new Date(rab.tanggalSelesai).toISOString().slice(0,10),catatan:rab.catatan||'',alasanPerubahan:''})} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{rab.status==='SELESAI'?'Edit Informasi LPJ':'Edit Informasi RAB'}</button>}
      {['DRAFT','DITOLAK'].includes(rab.status)&&<button onClick={()=>action(`/keuangan/rab/${id}/submit`)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"><Send size={15}/> Ajukan RAB</button>}
      {treasurer&&rab.status==='DIAJUKAN'&&<><button onClick={()=>open('approve',{items:rab.items.map(i=>({id:i.id,jumlahDisetujui:Number(i.jumlahDiajukan)})),rabQrDocumentId:rab.rabQrDocumentId||'',namaPejabat:'',jabatan:'',namaPejabat2:'',jabatan2:''})} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white">Setujui</button><button onClick={()=>open('reason',{action:'reject-rab'})} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">Tolak</button></>}
      {treasurer&&['DISETUJUI','DICAIRKAN_SEBAGIAN','DICAIRKAN_PENUH','REALISASI'].includes(rab.status)&&<button onClick={()=>open('pencairan',{tanggal:today(),akunKasId:accounts[0]?.id||'',sumberDana:'Bendahara'})} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-bold text-white"><Landmark size={15}/> Catat Dana Masuk</button>}
      {canSpend&&<button onClick={()=>open('pengeluaran',{tanggal:today(),akunKasId:accounts[0]?.id||'',kategoriId:categories[0]?.id||'',metode:'TRANSFER'})} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-bold text-white"><Plus size={15}/> Pengeluaran</button>}
      {treasurer&&rab.ringkasan.sisaKas>0&&<button onClick={()=>open('pengembalian',{tanggal:today(),akunKasId:accounts[0]?.id||''})} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white">Pengembalian</button>}
      {['REALISASI','DICAIRKAN_PENUH','PERLU_REVISI'].includes(rab.status)&&<button onClick={()=>action(`/keuangan/rab/${id}/submit-lpj`)} className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-bold text-white">Ajukan LPJ</button>}
      {treasurer&&rab.status==='MENUNGGU_VERIFIKASI_LPJ'&&<><button onClick={()=>open('reason',{action:'revision'})} className="rounded-lg bg-orange-100 px-3 py-2 text-sm font-bold text-orange-700">Minta Revisi</button><button onClick={()=>open('close',{lpjQrDocumentId:rab.lpjQrDocumentId||'',namaPejabat:'',jabatan:'',namaPejabat2:'',jabatan2:''})} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white"><CheckCircle2 size={15}/> Verifikasi & Tutup</button></>}
      {treasurer&&rab.status==='SELESAI'&&!rab.lpjQrDocument&&<button onClick={()=>open('sign-lpj',{lpjQrDocumentId:'',namaPejabat:'',jabatan:'',namaPejabat2:'',jabatan2:''})} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white"><FileCheck2 size={15}/> Tambahkan Tanda Tangan LPJ</button>}
    </div></div></div>

    <Section title="Dokumen & Bukti Transaksi" subtitle={`${attachments.filter((item)=>item.path).length} dari ${attachments.length} berkas tersedia`}><FinanceDocumentGallery attachments={attachments} saving={saving} onUpload={uploadEvidence}/></Section>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3"><div className="space-y-6 xl:col-span-2">
      <Section title="Rincian Anggaran"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-400"><th className="py-3">Uraian</th><th>Kategori</th><th className="text-right">Diajukan</th><th className="text-right">Disetujui</th><th className="text-right">Realisasi</th></tr></thead><tbody>{rab.items.map(item=>{const real=rab.pengeluarans.filter(e=>e.itemAnggaranId===item.id&&e.status==='VERIFIKASI').reduce((t,e)=>t+Number(e.nominal),0);return <tr key={item.id} className="border-b border-slate-50"><td className="py-3"><p className="font-semibold text-slate-700">{item.uraian}</p><p className="text-xs text-slate-400">{Number(item.volume)} {item.satuan} × {formatRupiah(item.hargaSatuan)}</p></td><td>{item.kategori?.nama||'-'}</td><td className="text-right">{formatRupiah(item.jumlahDiajukan)}</td><td className="text-right font-semibold">{formatRupiah(item.jumlahDisetujui)}</td><td className="text-right font-semibold text-violet-700">{formatRupiah(real)}</td></tr>})}</tbody></table></div></Section>
      <Section title="Pengeluaran / Realisasi" subtitle={`${rab.pengeluarans.length} transaksi`}><div className="space-y-3">{!rab.pengeluarans.length?<Empty text="Belum ada pengeluaran"/>:rab.pengeluarans.map(row=><div key={row.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-800">{row.uraian}</p><ExpenseBadge status={row.status}/></div><p className="mt-1 text-xs text-slate-500">{formatDate(row.tanggal)} · {row.kategori.nama} · {row.penerima||'Tanpa penerima'} {row.nomorBukti?`· Bukti ${row.nomorBukti}`:''}</p>{row.rejectedReason&&<p className="mt-1 text-xs font-semibold text-red-600">Ditolak: {row.rejectedReason}</p>}{row.cancelReason&&<p className="mt-1 text-xs font-semibold text-slate-500">Koreksi: {row.cancelReason}</p>}</div><div className="flex items-center gap-3"><p className="font-black text-slate-800">{formatRupiah(row.nominal)}</p>{treasurer&&row.status==='MENUNGGU_VERIFIKASI'&&<><button onClick={()=>open('verify-expense',{targetId:row.id,tanggal:new Date(row.tanggal).toISOString().slice(0,10),nominal:Number(row.nominal),uraian:row.uraian,kategoriId:row.kategoriId,itemAnggaranId:row.itemAnggaranId||'',akunKasId:row.akunKasId,metode:row.metode,penerima:row.penerima||'',nomorBukti:row.nomorBukti||'',keterangan:row.keterangan||'',allowOverBudget:row.allowOverBudget,overrideReason:row.overrideReason||'',existingBuktiPath:row.buktiPath})} className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">Periksa & Verifikasi</button><button onClick={()=>open('reason',{action:'reject-expense',targetId:row.id})} className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-700">Tolak</button></>}{treasurer&&row.status==='VERIFIKASI'&&rab.status!=='SELESAI'&&<button onClick={()=>open('reason',{action:'cancel-expense',targetId:row.id})} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">Koreksi</button>}</div></div>)}</div></Section>
    </div><div className="space-y-6">{(rab.rabQrDocument||rab.lpjQrDocument)&&<Section title="Verifikasi Elektronik"><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-1">{rab.rabQrDocument&&<VerificationCard verification={rab.rabQrDocument} label="Persetujuan RAB"/>}{rab.lpjQrDocument&&<VerificationCard verification={rab.lpjQrDocument} label="Persetujuan LPJ"/>}</div></Section>}<Section title="Dana Masuk">{!rab.pencairans.length?<Empty text="Belum ada pencairan"/>:<div className="space-y-3">{rab.pencairans.map(row=><MiniTransaction key={row.id} row={row} color="text-cyan-700" canCancel={treasurer&&row.status==='AKTIF'&&rab.status!=='SELESAI'} onCancel={()=>open('reason',{action:'cancel-disbursement',targetId:row.id})}/>)}</div>}</Section><Section title="Pengembalian Dana">{!rab.pengembalians.length?<Empty text="Belum ada pengembalian"/>:<div className="space-y-3">{rab.pengembalians.map(row=><MiniTransaction key={row.id} row={row} color="text-amber-700" canCancel={treasurer&&row.status==='AKTIF'&&rab.status!=='SELESAI'} onCancel={()=>open('reason',{action:'cancel-return',targetId:row.id})}/>)}</div>}</Section><Section title="Jejak Audit"><div className="max-h-80 space-y-3 overflow-y-auto">{rab.audits.map(row=><div key={row.id} className="border-l-2 border-emerald-200 pl-3"><p className="text-xs font-bold text-slate-700">{row.action.replaceAll('_',' ')}</p><p className="text-[11px] text-slate-400">{row.user.nama} · {formatDate(row.createdAt)}</p>{row.reason&&<p className="mt-1 text-xs text-slate-500">{row.reason}</p>}</div>)}</div></Section></div></div>

    {modal&&<Modal title={modal==='edit'?'Edit Draft RAB':modal==='edit-metadata'?(rab.status==='SELESAI'?'Edit Informasi LPJ':'Edit Informasi RAB'):modal==='approve'?'Persetujuan & Tanda Tangan RAB':modal==='close'?'Verifikasi & Tanda Tangan LPJ':modal==='sign-lpj'?'Lengkapi Tanda Tangan LPJ':modal==='verify-expense'?'Periksa Detail Realisasi':modal==='pencairan'?'Catat Dana Masuk':modal==='pengeluaran'?'Catat Pengeluaran':modal==='pengembalian'?'Catat Pengembalian Dana':'Berikan Alasan'} onClose={()=>setModal(null)}>
      {modal==='edit'&&<label className="mb-4 block space-y-1 text-sm font-semibold">QR-Code Verifikasi Dokumen<select value={form.rabQrDocumentId===undefined?(rab.rabQrDocumentId||''):form.rabQrDocumentId} onChange={e=>setForm({...form,rabQrDocumentId:e.target.value})} className={inputClass}><option value="">Buat QR baru saat persetujuan RAB</option>{verificationDocuments.map(document=><option key={document.id} value={document.id} disabled={!document.tersedia&&document.id!==rab.rabQrDocumentId}>{document.nomorSurat} · {document.token} · {document.namaPejabat}{!document.tersedia&&document.id!==rab.rabQrDocumentId?' (sudah digunakan)':''}</option>)}</select><span className="block text-xs font-normal text-slate-400">Pilihan berasal dari Riwayat & Pemantauan Verifikasi Dokumen.</span></label>}
      {modal==='edit'&&<div className="space-y-4"><div className="grid grid-cols-2 gap-3"><label className="col-span-2 space-y-1 text-sm font-semibold">Nama Kegiatan<input value={form.namaKegiatan||''} onChange={e=>setForm({...form,namaKegiatan:e.target.value})} className={inputClass}/></label><label className="col-span-2 space-y-1 text-sm font-semibold">No. Referensi Surat Permohonan<input value={form.nomorReferensi||''} onChange={e=>setForm({...form,nomorReferensi:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Penanggung Jawab<input value={form.penanggungJawab||''} onChange={e=>setForm({...form,penanggungJawab:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Program<select value={form.programAjahanId||''} onChange={e=>setForm({...form,programAjahanId:e.target.value})} className={inputClass}><option value="">Umum</option>{programs.map((program)=><option key={program.id} value={program.id}>{program.nama}</option>)}</select></label><label className="space-y-1 text-sm font-semibold">Mulai<input type="date" value={form.tanggalMulai||''} onChange={e=>setForm({...form,tanggalMulai:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Selesai<input type="date" value={form.tanggalSelesai||''} onChange={e=>setForm({...form,tanggalSelesai:e.target.value})} className={inputClass}/></label></div><label className="space-y-1 text-sm font-semibold">Tujuan<textarea rows="2" value={form.tujuan||''} onChange={e=>setForm({...form,tujuan:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Ganti Dokumen Pendukung<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setForm({...form,dokumen:e.target.files[0]})} className={inputClass}/></label><div className="space-y-2"><p className="text-sm font-bold text-slate-700">Item Anggaran</p>{form.items.map((item,index)=><div key={index} className="grid grid-cols-12 gap-2 rounded-xl bg-slate-50 p-2"><select value={item.kategoriId||''} onChange={e=>setForm({...form,items:form.items.map((r,i)=>i===index?{...r,kategoriId:e.target.value}:r)})} className={`${inputClass} col-span-4`}><option value="">Kategori</option>{categories.map(c=><option key={c.id} value={c.id}>{c.nama}</option>)}</select><input value={item.uraian} onChange={e=>setForm({...form,items:form.items.map((r,i)=>i===index?{...r,uraian:e.target.value}:r)})} className={`${inputClass} col-span-8`}/><input type="number" value={item.volume} onChange={e=>setForm({...form,items:form.items.map((r,i)=>i===index?{...r,volume:e.target.value}:r)})} className={`${inputClass} col-span-3`}/><input value={item.satuan} onChange={e=>setForm({...form,items:form.items.map((r,i)=>i===index?{...r,satuan:e.target.value}:r)})} className={`${inputClass} col-span-3`}/><input type="number" value={item.hargaSatuan} onChange={e=>setForm({...form,items:form.items.map((r,i)=>i===index?{...r,hargaSatuan:e.target.value}:r)})} className={`${inputClass} col-span-5`}/><button disabled={form.items.length===1} onClick={()=>setForm({...form,items:form.items.filter((_,i)=>i!==index)})} className="col-span-1 text-red-500">×</button></div>)}<button onClick={()=>setForm({...form,items:[...form.items,{kategoriId:'',uraian:'',volume:1,satuan:'unit',hargaSatuan:''}]})} className="text-sm font-bold text-emerald-600">+ Tambah item</button></div><Submit saving={saving} label="Simpan Perubahan" onClick={saveDraft}/></div>}
      {modal==='edit-metadata'&&<div className="space-y-4">
        <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800">Edit terbatas ini tidak mengubah nilai anggaran, transaksi, status, QR-Code, atau tanda tangan elektronik.</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold sm:col-span-2">Nama Kegiatan<input required value={form.namaKegiatan||''} onChange={e=>setForm({...form,namaKegiatan:e.target.value})} className={inputClass}/></label>
          <label className="space-y-1 text-sm font-semibold sm:col-span-2">No. Referensi Surat Permohonan<input value={form.nomorReferensi||''} onChange={e=>setForm({...form,nomorReferensi:e.target.value})} className={inputClass}/></label>
          <label className="space-y-1 text-sm font-semibold">Penanggung Jawab<input required value={form.penanggungJawab||''} onChange={e=>setForm({...form,penanggungJawab:e.target.value})} className={inputClass}/></label>
          <label className="space-y-1 text-sm font-semibold">Program<select value={form.programAjahanId||''} onChange={e=>setForm({...form,programAjahanId:e.target.value})} className={inputClass}><option value="">Umum</option>{programs.map(program=><option key={program.id} value={program.id}>{program.nama}</option>)}</select></label>
          <label className="space-y-1 text-sm font-semibold">Tanggal Mulai<input required type="date" value={form.tanggalMulai||''} onChange={e=>setForm({...form,tanggalMulai:e.target.value})} className={inputClass}/></label>
          <label className="space-y-1 text-sm font-semibold">Tanggal Selesai<input required type="date" min={form.tanggalMulai||undefined} value={form.tanggalSelesai||''} onChange={e=>setForm({...form,tanggalSelesai:e.target.value})} className={inputClass}/></label>
        </div>
        <label className="block space-y-1 text-sm font-semibold">Tujuan<textarea rows="2" value={form.tujuan||''} onChange={e=>setForm({...form,tujuan:e.target.value})} className={inputClass}/></label>
        <label className="block space-y-1 text-sm font-semibold">Catatan<textarea rows="2" value={form.catatan||''} onChange={e=>setForm({...form,catatan:e.target.value})} className={inputClass}/></label>
        <label className="block space-y-1 text-sm font-semibold text-red-700">Alasan Perubahan<textarea required rows="3" placeholder="Jelaskan alasan koreksi untuk jejak audit..." value={form.alasanPerubahan||''} onChange={e=>setForm({...form,alasanPerubahan:e.target.value})} className={inputClass}/></label>
        <Submit saving={saving} label="Simpan Informasi" onClick={saveMetadata}/>
      </div>}
      {modal==='approve'&&<div className="space-y-4"><div className="space-y-3">{rab.items.map((item,index)=><label key={item.id} className="block rounded-xl bg-slate-50 p-3 text-sm"><span className="font-semibold text-slate-700">{item.uraian}</span><span className="float-right text-xs text-slate-400">Diajukan {formatRupiah(item.jumlahDiajukan)}</span><input type="number" min="0" value={form.items[index].jumlahDisetujui} onChange={e=>setForm({...form,items:form.items.map((r,i)=>i===index?{...r,jumlahDisetujui:e.target.value}:r)})} className={`${inputClass} mt-2`}/></label>)}</div><label className="block space-y-1 text-sm font-semibold">Pilih Verifikasi Dokumen<select value={form.rabQrDocumentId||''} onChange={e=>setForm({...form,rabQrDocumentId:e.target.value})} className={inputClass}><option value="">Input data penandatangan manual</option>{verificationDocuments.map(document=><option key={document.id} value={document.id} disabled={!document.tersedia&&document.id!==rab.rabQrDocumentId}>{document.nomorSurat} · {document.token} · {document.namaPejabat}{!document.tersedia&&document.id!==rab.rabQrDocumentId?' (sudah digunakan)':''}</option>)}</select><span className="block text-xs font-normal text-slate-400">Daftar berasal dari Riwayat & Pemantauan Verifikasi Dokumen.</span></label>{approvalVerification?<SelectedVerificationDocument document={approvalVerification}/>:<SignerFields form={form} setForm={setForm}/>}<Submit saving={saving} onClick={approveRabAction} label="Setujui & Tanda Tangani RAB"/></div>}
      {modal==='close'&&<div className="space-y-4"><div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Pastikan seluruh realisasi, bukti transaksi, dan pengembalian dana telah benar. Setelah ditutup, LPJ tidak dapat dikoreksi.</div><label className="block space-y-1 text-sm font-semibold">Pilih Verifikasi Dokumen<select value={form.lpjQrDocumentId||''} onChange={e=>setForm({...form,lpjQrDocumentId:e.target.value})} className={inputClass}><option value="">Input data penandatangan manual</option>{verificationDocuments.map(document=><option key={document.id} value={document.id} disabled={!document.tersedia&&document.id!==rab.lpjQrDocumentId}>{document.nomorSurat} · {document.token} · {document.namaPejabat}{!document.tersedia&&document.id!==rab.lpjQrDocumentId?' (sudah digunakan)':''}</option>)}</select><span className="block text-xs font-normal text-slate-400">Daftar berasal dari Riwayat & Pemantauan Verifikasi Dokumen.</span></label>{lpjVerification?<SelectedVerificationDocument document={lpjVerification}/>:<SignerFields form={form} setForm={setForm}/>}<Submit saving={saving} onClick={closeLpjAction} label="Verifikasi, Tanda Tangani & Tutup LPJ"/></div>}
      {modal==='sign-lpj'&&<div className="space-y-4"><div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">Gunakan fitur ini untuk melengkapi tanda tangan elektronik LPJ lama. Status selesai, transaksi, dan nilai laporan tidak akan berubah.</div><label className="block space-y-1 text-sm font-semibold">Pilih Verifikasi Dokumen<select value={form.lpjQrDocumentId||''} onChange={e=>setForm({...form,lpjQrDocumentId:e.target.value})} className={inputClass}><option value="">Input data penandatangan manual</option>{verificationDocuments.map(document=><option key={document.id} value={document.id} disabled={!document.tersedia}>{document.nomorSurat} · {document.token} · {document.namaPejabat}{!document.tersedia?' (sudah digunakan)':''}</option>)}</select><span className="block text-xs font-normal text-slate-400">Daftar berasal dari Riwayat & Pemantauan Verifikasi Dokumen.</span></label>{lpjVerification?<SelectedVerificationDocument document={lpjVerification}/>:<SignerFields form={form} setForm={setForm}/>}<Submit saving={saving} onClick={signCompletedLpjAction} label="Tambahkan Tanda Tangan LPJ"/></div>}
      {modal==='verify-expense'&&<div className="space-y-4"><div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Periksa dan bila perlu edit rincian berikut sebelum menyetujui realisasi.</div><ExpenseFields form={form} setForm={setForm} categories={categories} accounts={accounts} items={rab.items}/>{form.existingBuktiPath&&<div><p className="mb-2 text-sm font-bold text-slate-700">Bukti yang diunggah</p><FinanceDocumentPreview path={form.existingBuktiPath} compact/></div>}<div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><button type="button" disabled={saving} onClick={()=>saveExpenseVerification(false)} className="rounded-xl border border-emerald-600 p-3 font-bold text-emerald-700 disabled:opacity-50">{saving?'Memproses...':'Simpan Perubahan'}</button><Submit saving={saving} label="Simpan & Verifikasi" onClick={()=>saveExpenseVerification(true)}/></div></div>}
      {modal==='reason'&&<div className="space-y-4"><textarea autoFocus rows="4" placeholder="Tuliskan alasan secara jelas..." value={form.alasan||''} onChange={e=>setForm({...form,alasan:e.target.value})} className={inputClass}/><Submit saving={saving} label="Simpan Keputusan" onClick={()=>form.action==='reject-rab'?action(`/keuangan/rab/${id}/reject`,{alasan:form.alasan}):form.action==='revision'?action(`/keuangan/rab/${id}/request-revision`,{alasan:form.alasan}):form.action==='cancel-expense'?action(`/keuangan/pengeluaran/${form.targetId}/cancel`,{alasan:form.alasan}):form.action==='cancel-disbursement'?action(`/keuangan/pencairan/${form.targetId}/cancel`,{alasan:form.alasan}):form.action==='cancel-return'?action(`/keuangan/pengembalian/${form.targetId}/cancel`,{alasan:form.alasan}):action(`/keuangan/pengeluaran/${form.targetId}/reject`,{alasan:form.alasan})}/></div>}
      {modal==='pencairan'&&<TransactionForm form={form} setForm={setForm} accounts={accounts} kind="pencairan"><label className="space-y-1 text-sm font-semibold">Sumber Dana<input required value={form.sumberDana||''} onChange={e=>setForm({...form,sumberDana:e.target.value})} className={inputClass}/></label><Submit saving={saving} label="Simpan Dana Masuk" onClick={()=>submitTransaction('pencairan')}/></TransactionForm>}
      {modal==='pengembalian'&&<TransactionForm form={form} setForm={setForm} accounts={accounts} kind="pengembalian"><Submit saving={saving} label="Simpan Pengembalian" onClick={()=>submitTransaction('pengembalian')}/></TransactionForm>}
      {modal==='pengeluaran'&&<div className="space-y-4"><div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm font-semibold">Tanggal<input type="date" value={form.tanggal||''} onChange={e=>setForm({...form,tanggal:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Nominal<input type="number" min="1" value={form.nominal||''} onChange={e=>setForm({...form,nominal:e.target.value})} className={inputClass}/></label></div><label className="space-y-1 text-sm font-semibold">Uraian<input value={form.uraian||''} onChange={e=>setForm({...form,uraian:e.target.value})} className={inputClass}/></label><div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm font-semibold">Kategori<select value={form.kategoriId||''} onChange={e=>setForm({...form,kategoriId:e.target.value})} className={inputClass}>{categories.map(r=><option key={r.id} value={r.id}>{r.nama}</option>)}</select></label><label className="space-y-1 text-sm font-semibold">Item RAB<select value={form.itemAnggaranId||''} onChange={e=>setForm({...form,itemAnggaranId:e.target.value})} className={inputClass}><option value="">Tanpa item khusus</option>{rab.items.map(r=><option key={r.id} value={r.id}>{r.uraian}</option>)}</select></label><label className="space-y-1 text-sm font-semibold">Akun Kas<select value={form.akunKasId||''} onChange={e=>setForm({...form,akunKasId:e.target.value})} className={inputClass}>{accounts.map(r=><option key={r.id} value={r.id}>{r.nama}</option>)}</select></label><label className="space-y-1 text-sm font-semibold">Metode<select value={form.metode||''} onChange={e=>setForm({...form,metode:e.target.value})} className={inputClass}><option>TRANSFER</option><option>TUNAI</option><option>QRIS</option><option>LAINNYA</option></select></label></div><div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm font-semibold">Penerima<input value={form.penerima||''} onChange={e=>setForm({...form,penerima:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Nomor Bukti<input value={form.nomorBukti||''} onChange={e=>setForm({...form,nomorBukti:e.target.value})} className={inputClass}/></label></div><label className="space-y-1 text-sm font-semibold">Bukti Transaksi<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setForm({...form,bukti:e.target.files[0]})} className={inputClass}/></label>{treasurer&&<label className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><input type="checkbox" checked={!!form.allowOverBudget} onChange={e=>setForm({...form,allowOverBudget:e.target.checked})}/><span>Izinkan melampaui item anggaran. Jika dipilih, alasan pengecualian wajib diisi.</span></label>}{form.allowOverBudget&&<textarea placeholder="Alasan pengecualian..." value={form.overrideReason||''} onChange={e=>setForm({...form,overrideReason:e.target.value})} className={inputClass}/>}<Submit saving={saving} label="Simpan Pengeluaran" onClick={()=>submitTransaction('pengeluaran')}/></div>}
    </Modal>}
  </div>;
}

const Section=({title,subtitle,children})=><section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="mb-4 flex items-end justify-between"><h2 className="font-bold text-slate-800">{title}</h2>{subtitle&&<span className="text-xs text-slate-400">{subtitle}</span>}</div>{children}</section>;
const Empty=({text})=><p className="py-5 text-center text-sm text-slate-400">{text}</p>;
const ExpenseBadge=({status})=>{const c={MENUNGGU_VERIFIKASI:'bg-amber-100 text-amber-700',VERIFIKASI:'bg-emerald-100 text-emerald-700',DITOLAK:'bg-red-100 text-red-700',DIBATALKAN:'bg-slate-100 text-slate-500'};return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c[status]}`}>{status.replaceAll('_',' ')}</span>};
const MiniTransaction=({row,color,canCancel,onCancel})=><div className="rounded-xl bg-slate-50 p-3"><div className="flex justify-between"><p className={`font-bold ${row.status==='DIBATALKAN'?'line-through text-slate-400':color}`}>{formatRupiah(row.nominal)}</p><span className="text-[10px] font-bold text-slate-400">{row.status}</span></div><div className="mt-1 flex items-center justify-between"><p className="text-xs text-slate-500">{formatDate(row.tanggal)} · {row.akunKas.nama}</p>{canCancel&&<button onClick={onCancel} className="text-[10px] font-bold text-red-500">Batalkan</button>}</div>{row.cancelReason&&<p className="mt-1 text-[10px] text-slate-400">Alasan: {row.cancelReason}</p>}</div>;
const Modal=({title,onClose,children})=><div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 md:p-10"><div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><h3 className="font-black text-slate-800">{title}</h3><button onClick={onClose}><X size={20}/></button></div><div className="p-5">{children}</div></div></div>;
const Submit=({saving,label,onClick})=><button type="button" disabled={saving} onClick={onClick} className="w-full rounded-xl bg-emerald-600 p-3 font-bold text-white disabled:opacity-50">{saving?'Memproses...':label}</button>;
const TransactionForm=({form,setForm,accounts,children})=><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm font-semibold">Tanggal<input type="date" value={form.tanggal||''} onChange={e=>setForm({...form,tanggal:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Nominal<input type="number" min="1" value={form.nominal||''} onChange={e=>setForm({...form,nominal:e.target.value})} className={inputClass}/></label></div><label className="space-y-1 text-sm font-semibold">Akun Kas<select value={form.akunKasId||''} onChange={e=>setForm({...form,akunKasId:e.target.value})} className={inputClass}>{accounts.map(r=><option key={r.id} value={r.id}>{r.nama}</option>)}</select></label><label className="space-y-1 text-sm font-semibold">Nomor Referensi<input value={form.nomorReferensi||''} onChange={e=>setForm({...form,nomorReferensi:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Bukti Transaksi<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setForm({...form,bukti:e.target.files[0]})} className={inputClass}/></label>{children}</div>;

const SignerFields=({form,setForm})=><div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4"><p className="mb-3 text-sm font-black text-emerald-900">Data Penandatangan Elektronik</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm font-semibold">Pejabat Penandatangan 1<input required value={form.namaPejabat||''} onChange={e=>setForm({...form,namaPejabat:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Jabatan Penandatangan 1<input required value={form.jabatan||''} onChange={e=>setForm({...form,jabatan:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Pejabat Penandatangan 2<input required value={form.namaPejabat2||''} onChange={e=>setForm({...form,namaPejabat2:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Jabatan Penandatangan 2<input required value={form.jabatan2||''} onChange={e=>setForm({...form,jabatan2:e.target.value})} className={inputClass}/></label></div><p className="mt-3 text-xs text-emerald-700">QR-Code verifikasi akan dibuat otomatis setelah dokumen disetujui.</p></div>;

const SelectedVerificationDocument=({document})=><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-emerald-700">QR Verifikasi Terpilih</p><p className="mt-1 font-bold text-slate-800">{document.nomorSurat}</p><p className="text-xs text-slate-500">{document.keteranganSurat}</p></div><span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-emerald-700">{document.token}</span></div><div className="mt-3 grid grid-cols-1 gap-2 border-t border-emerald-200 pt-3 text-xs sm:grid-cols-2"><p><span className="font-bold">{document.namaPejabat}</span><br/>{document.jabatan}</p><p><span className="font-bold">{document.namaPejabat2||'-'}</span><br/>{document.jabatan2||'-'}</p></div><p className="mt-3 text-xs text-emerald-700">RAB akan memakai data penandatangan dan QR-Code ini tanpa membuat rekaman baru.</p></div>;

const ExpenseFields=({form,setForm,categories,accounts,items})=><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm font-semibold">Tanggal<input type="date" value={form.tanggal||''} onChange={e=>setForm({...form,tanggal:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Nominal<input type="number" min="1" value={form.nominal||''} onChange={e=>setForm({...form,nominal:e.target.value})} className={inputClass}/></label></div><label className="space-y-1 text-sm font-semibold">Uraian<input value={form.uraian||''} onChange={e=>setForm({...form,uraian:e.target.value})} className={inputClass}/></label><div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm font-semibold">Kategori<select value={form.kategoriId||''} onChange={e=>setForm({...form,kategoriId:e.target.value})} className={inputClass}>{categories.map(row=><option key={row.id} value={row.id}>{row.nama}</option>)}</select></label><label className="space-y-1 text-sm font-semibold">Item RAB<select value={form.itemAnggaranId||''} onChange={e=>setForm({...form,itemAnggaranId:e.target.value})} className={inputClass}><option value="">Tanpa item khusus</option>{items.map(row=><option key={row.id} value={row.id}>{row.uraian}</option>)}</select></label><label className="space-y-1 text-sm font-semibold">Akun Kas<select value={form.akunKasId||''} onChange={e=>setForm({...form,akunKasId:e.target.value})} className={inputClass}>{accounts.map(row=><option key={row.id} value={row.id}>{row.nama}</option>)}</select></label><label className="space-y-1 text-sm font-semibold">Metode<select value={form.metode||''} onChange={e=>setForm({...form,metode:e.target.value})} className={inputClass}><option>TRANSFER</option><option>TUNAI</option><option>QRIS</option><option>LAINNYA</option></select></label></div><div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm font-semibold">Penerima<input value={form.penerima||''} onChange={e=>setForm({...form,penerima:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Nomor Bukti<input value={form.nomorBukti||''} onChange={e=>setForm({...form,nomorBukti:e.target.value})} className={inputClass}/></label></div><label className="space-y-1 text-sm font-semibold">Keterangan<textarea rows="2" value={form.keterangan||''} onChange={e=>setForm({...form,keterangan:e.target.value})} className={inputClass}/></label><label className="space-y-1 text-sm font-semibold">Ganti Bukti Transaksi (opsional)<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setForm({...form,bukti:e.target.files[0]})} className={inputClass}/></label><label className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><input type="checkbox" checked={!!form.allowOverBudget} onChange={e=>setForm({...form,allowOverBudget:e.target.checked})}/><span>Izinkan melampaui item anggaran dengan alasan yang dapat diaudit.</span></label>{form.allowOverBudget&&<textarea placeholder="Alasan pengecualian..." value={form.overrideReason||''} onChange={e=>setForm({...form,overrideReason:e.target.value})} className={inputClass}/>}</div>;

function FinanceDocumentPreview({path,compact=false}) {
  const url=useFileUrl(path,'/keuangan/files');
  if(!path) return <Empty text="Belum ada dokumen pendukung"/>;
  if(!url) return <div className={`${compact?'h-28':'h-44'} flex items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400`}>Memuat dokumen...</div>;
  const isPdf=path.toLowerCase().endsWith('.pdf');
  const filename=path.split('/').pop();
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><div className={`${compact?'h-32':'h-48'} flex items-center justify-center overflow-hidden bg-slate-100`}>{isPdf?<iframe src={url} title={filename} className="h-full w-full"/>:<img src={url} alt={filename} className="h-full w-full object-contain"/>}</div><div className="flex items-center justify-between gap-2 border-t bg-white p-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-700">{filename}</p><p className="text-[10px] uppercase text-slate-400">{isPdf?'Dokumen PDF':'Gambar'}</p></div><div className="flex gap-1"><a href={url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50" title="Lihat"><Eye size={16}/></a><a href={url} download={filename} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Download"><Download size={16}/></a></div></div></div>;
}

const FinanceDocumentGallery=({attachments,saving,onUpload})=>!attachments.length?<Empty text="Belum ada transaksi yang memiliki slot dokumen"/>:<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{attachments.map((attachment,index)=><div key={`${attachment.endpoint}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3"><div className="mb-2"><p className="text-sm font-black text-slate-700">{attachment.label}</p><p className="truncate text-xs text-slate-400">{attachment.detail}</p></div>{attachment.path?<FinanceDocumentPreview path={attachment.path} compact/>:<div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400"><FileText size={28}/><p className="mt-2 text-xs font-semibold">Berkas belum tersedia</p></div>}<label className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${saving?'pointer-events-none border-slate-200 text-slate-300':'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'}`}><Upload size={14}/>{attachment.path?'Ganti Berkas':'Unggah Berkas'}<input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={saving} className="hidden" onChange={(event)=>{const file=event.target.files?.[0];if(file)onUpload(attachment.endpoint,file);event.target.value='';}}/></label></div>)}</div>;

const VerificationCard=({verification,label})=>{const link=`${window.location.origin}/verify/${verification.token}`;return <div className="text-center"><div className="mx-auto w-fit rounded-xl border border-emerald-100 bg-white p-2"><QRCodeCanvas id={`finance-qr-${verification.token}`} value={link} size={112} level="H" includeMargin imageSettings={{src:'/logo.png',height:24,width:24,excavate:true}}/></div><p className="mt-3 text-xs font-black uppercase tracking-wider text-emerald-700">{label}</p><p className="mt-1 text-xs text-slate-500">{verification.namaPejabat} & {verification.namaPejabat2}</p><a href={link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><FileText size={13}/> Verifikasi {verification.token}</a></div>};
