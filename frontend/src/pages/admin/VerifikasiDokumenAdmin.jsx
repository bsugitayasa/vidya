import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode, FileCheck, Search, ArrowUpDown, ChevronLeft, ChevronRight,
  Download, FileSpreadsheet, FileText, Loader2, Plus, Info, AlertCircle, X, ExternalLink,
  Edit3, Trash2, Save, AlertTriangle, Settings2, ChevronDown, BookTemplate
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function VerifikasiDokumenAdmin() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // State Form
  const [nomorSurat, setNomorSurat] = useState('');
  const [keteranganSurat, setKeteranganSurat] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [namaPejabat, setNamaPejabat] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [namaPejabat2, setNamaPejabat2] = useState('');
  const [jabatan2, setJabatan2] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState(null);

  // State Template Penandatangan
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ namaTemplate: '', namaPejabat: '', jabatan: '', namaPejabat2: '', jabatan2: '' });
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // State Table & Monitoring
  const [docsList, setDocsList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState(null);

  // Ref untuk QR canvas download
  const qrRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, [page, sortBy, sortOrder]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/template-penandatangan');
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Fetch templates error:', error);
    }
  };

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return; // "Ketik Manual" selected
    const tpl = templates.find(t => t.id === parseInt(templateId));
    if (tpl) {
      setNamaPejabat(tpl.namaPejabat);
      setJabatan(tpl.jabatan);
      setNamaPejabat2(tpl.namaPejabat2 || '');
      setJabatan2(tpl.jabatan2 || '');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.namaTemplate || !templateForm.namaPejabat || !templateForm.jabatan) {
      toast.warning('Nama template, nama pejabat, dan jabatan wajib diisi!');
      return;
    }
    setIsSavingTemplate(true);
    try {
      if (editingTemplate) {
        const response = await api.put(`/template-penandatangan/${editingTemplate.id}`, templateForm);
        if (response.data.success) {
          toast.success('Template berhasil diperbarui');
        }
      } else {
        const response = await api.post('/template-penandatangan', templateForm);
        if (response.data.success) {
          toast.success('Template baru berhasil dibuat');
        }
      }
      setTemplateForm({ namaTemplate: '', namaPejabat: '', jabatan: '', namaPejabat2: '', jabatan2: '' });
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Save template error:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      const response = await api.delete(`/template-penandatangan/${id}`);
      if (response.data.success) {
        toast.success('Template berhasil dihapus');
        fetchTemplates();
      }
    } catch (error) {
      console.error('Delete template error:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus template');
    }
  };

  const handleStartEditTemplate = (tpl) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      namaTemplate: tpl.namaTemplate,
      namaPejabat: tpl.namaPejabat,
      jabatan: tpl.jabatan,
      namaPejabat2: tpl.namaPejabat2 || '',
      jabatan2: tpl.jabatan2 || '',
    });
  };

  const handleCancelEditTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ namaTemplate: '', namaPejabat: '', jabatan: '', namaPejabat2: '', jabatan2: '' });
  };

  const fetchDocuments = async () => {
    setIsLoadingList(true);
    try {
      const response = await api.get('/qr-document', {
        params: {
          page,
          limit: 10,
          sortBy,
          sortOrder,
          search
        }
      });
      if (response.data.success) {
        setDocsList(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Fetch documents error:', error);
      toast.error('Gagal memuat riwayat dokumen');
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchDocuments();
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error('Akses ditolak. Hanya Super Admin yang dapat membuat QR-code.');
      return;
    }

    if (!nomorSurat || !keteranganSurat || !tanggal || !namaPejabat || !jabatan) {
      toast.warning('Field utama formulir harus diisi!');
      return;
    }

    const payload = {
      nomorSurat,
      keteranganSurat,
      tanggal,
      namaPejabat,
      jabatan,
      namaPejabat2: namaPejabat2 || null,
      jabatan2: jabatan2 || null
    };

    if (editingDoc) {
      // Trigger high-security confirmation modal
      setPendingUpdatePayload(payload);
    } else {
      setIsGenerating(true);
      try {
        const response = await api.post('/qr-document', payload);

        if (response.data.success) {
          toast.success('QR-Code Dokumen berhasil dibuat!');
          setGeneratedDoc(response.data.data);
          handleCancelEdit();
          setPage(1);
          fetchDocuments();
        }
      } catch (error) {
        console.error('Generate document error:', error);
        toast.error(error.response?.data?.message || 'Gagal membuat QR Dokumen');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleStartEdit = (doc) => {
    setEditingDoc(doc);
    setNomorSurat(doc.nomorSurat);
    setKeteranganSurat(doc.keteranganSurat);
    setTanggal(new Date(doc.tanggal).toISOString().split('T')[0]);
    setNamaPejabat(doc.namaPejabat);
    setJabatan(doc.jabatan);
    setNamaPejabat2(doc.namaPejabat2 || '');
    setJabatan2(doc.jabatan2 || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info(`Mode Edit aktif untuk Token: ${doc.token}`);
  };

  const handleCancelEdit = () => {
    setEditingDoc(null);
    setNomorSurat('');
    setKeteranganSurat('');
    setTanggal('');
    setNamaPejabat('');
    setJabatan('');
    setNamaPejabat2('');
    setJabatan2('');
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    try {
      const response = await api.delete(`/qr-document/${docToDelete.id}`);
      if (response.data.success) {
        toast.success(`Dokumen ${docToDelete.token} berhasil dihapus dari database!`);
        setDocToDelete(null);
        setPage(1);
        fetchDocuments();
      }
    } catch (error) {
      console.error('Delete document error:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus dokumen');
    }
  };

  const handleConfirmUpdate = async () => {
    if (!pendingUpdatePayload || !editingDoc) return;
    setIsGenerating(true);
    try {
      const response = await api.put(`/qr-document/${editingDoc.id}`, pendingUpdatePayload);
      if (response.data.success) {
        toast.success(`Metadata dokumen ${editingDoc.token} berhasil diperbarui (re-generate)!`);
        setPendingUpdatePayload(null);
        handleCancelEdit();
        fetchDocuments();
      }
    } catch (error) {
      console.error('Update document error:', error);
      toast.error(error.response?.data?.message || 'Gagal memperbarui dokumen');
    } finally {
      setIsGenerating(false);
    }
  };

  const getBase64ImageFromUrl = async (imageUrl) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", function () {
          resolve(reader.result);
        }, false);
        reader.onerror = () => {
          reject(new Error("Gagal membaca blob gambar"));
        };
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('Gagal mengambil base64 logo:', err);
      return null;
    }
  };

  // Helper: Dapatkan URL verifikasi penuh
  const getVerificationUrl = (token) => {
    return `${window.location.origin}/verify/${token}`;
  };

  // Fungsi Unduh QR PNG
  const downloadPng = (doc) => {
    const canvas = document.getElementById(`qr-canvas-${doc.token}`);
    if (!canvas) {
      toast.error('Gagal mengambil elemen QR-code');
      return;
    }

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${doc.token}_${doc.nomorSurat.replace(/[\/\\?%*:|"<>]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`QR PNG ${doc.token} berhasil diunduh!`);
  };

  // Fungsi Unduh Surat PDF Resmi (Berisi stempel QR-code)
  const downloadPdfDocument = async (doc) => {
    const canvas = document.getElementById(`qr-canvas-${doc.token}`);
    if (!canvas) {
      toast.error('Gagal mengambil elemen QR-code');
      return;
    }

    const qrDataUrl = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Load logo as base64 image dynamically
    let logoBase64 = null;
    try {
      logoBase64 = await getBase64ImageFromUrl('/logo.png');
    } catch (err) {
      console.error('Gagal memuat logo untuk PDF:', err);
    }

    // 1. Kop Surat (Official Letterhead with Logo on the Left and Text on the Right)
    if (logoBase64) {
      // Draw Logo on the Left (Symmetric vertical alignment)
      pdf.addImage(logoBase64, 'PNG', 20, 12, 17, 17);

      // Draw Aligned Text on the Right
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('PERKUMPULAN DHARMOPADESA PUSAT NUSANTARA', 41, 16);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text('Sekretariat Kantor Pusat: Pasraman Dharma Wasitha, Wantilan Capung Mas, Banjar Batan Ancak,', 41, 20.5);
      pdf.text('Desa Mas, Kecamatan Ubud, Kabupaten Gianyar, Provinsi Bali, Indonesia - 80571', 41, 24);

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      pdf.text('SK Kemenkumham RI No. AHU-0000052.AH.01.07.Tahun 2020 | Website: perkumpulan-dharmopadesa-pusat-nusantara.cloud', 41, 27.5);
      pdf.setTextColor(0, 0, 0); // Restore back to black
    } else {
      // Fallback Centered header if logo fails to load
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('PERKUMPULAN DHARMOPADESA PUSAT NUSANTARA', 105, 16, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text('Sekretariat Kantor Pusat: Pasraman Dharma Wasitha, Wantilan Capung Mas, Banjar Batan Ancak,', 105, 21, { align: 'center' });
      pdf.text('Desa Mas, Kecamatan Ubud, Kabupaten Gianyar, Provinsi Bali, Indonesia - 80571', 105, 25, { align: 'center' });

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 100, 100);
      pdf.text('SK Kemenkumham RI No. AHU-0000052.AH.01.07.Tahun 2020 | Website: perkumpulan-dharmopadesa-pusat-nusantara.cloud', 105, 29, { align: 'center' });
      pdf.setTextColor(0, 0, 0); // Restore back to black
    }

    // Garis Kop
    pdf.setLineWidth(0.8);
    pdf.line(20, 33, 190, 33);
    pdf.setLineWidth(0.2);
    pdf.line(20, 34, 190, 34);

    // 2. Judul Surat
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('SURAT KETERANGAN VERIFIKASI DIGITAL', 105, 45, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Nomor: ${doc.nomorSurat}`, 105, 50, { align: 'center' });

    // 3. Isi Surat
    pdf.text('Dengan ini, Perkumpulan Dharmopadesa Pusat Nusantara menerangkan bahwa dokumen dengan', 20, 65);
    pdf.text('detail berikut ini adalah sah, tercatat resmi, dan terverifikasi secara elektronik di dalam database:', 20, 70);

    // Metadata Table
    const dataY = 80;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Detail Dokumen:', 20, dataY);

    pdf.setFont('helvetica', 'normal');

    const hasSecondSignatory = doc.namaPejabat2 && doc.namaPejabat2.trim() !== '';

    const fields = [
      { label: 'Nomor Surat', val: doc.nomorSurat },
      { label: 'Keterangan', val: doc.keteranganSurat },
      { label: 'Tanggal Terbit', val: new Date(doc.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
    ];

    if (hasSecondSignatory) {
      fields.push({ label: 'Pejabat Penandatangan 1', val: doc.namaPejabat });
      fields.push({ label: 'Jabatan 1', val: doc.jabatan });
      fields.push({ label: 'Pejabat Penandatangan 2', val: doc.namaPejabat2 });
      fields.push({ label: 'Jabatan 2', val: doc.jabatan2 });
    } else {
      fields.push({ label: 'Pejabat Penandatangan', val: doc.namaPejabat });
      fields.push({ label: 'Jabatan', val: doc.jabatan });
    }

    fields.push({ label: 'Token Keamanan', val: doc.token });

    let currentY = dataY + 8;
    fields.forEach(f => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(f.label, 25, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`:  ${f.val}`, 70, currentY);
      currentY += 8;
    });

    // 4. Box Verifikasi QR Code
    const boxY = currentY + 15;
    pdf.setFillColor(248, 250, 252); // light slate background
    pdf.setDrawColor(226, 232, 240); // slate border
    pdf.roundedRect(20, boxY, 170, 45, 3, 3, 'FD');

    // QR Image
    pdf.addImage(qrDataUrl, 'PNG', 25, boxY + 5, 35, 35);

    // QR Description
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('PINDAI QR-CODE DI SAMPING UNTUK VERIFIKASI ASLI', 68, boxY + 12);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Dokumen ini dilengkapi dengan pengaman digital verifikasi token.', 68, boxY + 18);
    pdf.text('Apabila dokumen dicetak atau dibagikan secara digital, penerima dapat memindai', 68, boxY + 22);
    pdf.text('QR-code ini menggunakan kamera smartphone untuk memastikan validitas dan kesesuaian', 68, boxY + 26);
    pdf.text('data secara real-time dengan server database kami.', 68, boxY + 30);
    pdf.text(`URL Verifikasi: ${getVerificationUrl(doc.token)}`, 68, boxY + 36);

    // 5. Tanda Tangan
    const sigY = boxY + 55;
    pdf.setFontSize(10);

    if (hasSecondSignatory) {
      // Date centered above signatures
      pdf.text('Denpasar, ' + new Date(doc.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 105, sigY, { align: 'center' });

      // Left Signatory (Signatory 1)
      pdf.setFont('helvetica', 'normal');
      pdf.text(doc.jabatan, 25, sigY + 8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(doc.namaPejabat, 25, sigY + 35);
      pdf.line(25, sigY + 36, 85, sigY + 36);

      // Right Signatory (Signatory 2)
      pdf.setFont('helvetica', 'normal');
      pdf.text(doc.jabatan2, 120, sigY + 8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(doc.namaPejabat2, 120, sigY + 35);
      pdf.line(120, sigY + 36, 180, sigY + 36);
    } else {
      // Single Signatory (Right)
      pdf.text('Denpasar, ' + new Date(doc.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 130, sigY);
      pdf.text(doc.jabatan, 130, sigY + 8);

      pdf.setFont('helvetica', 'bold');
      pdf.text(doc.namaPejabat, 130, sigY + 35);
      pdf.line(130, sigY + 36, 180, sigY + 36);
    }

    pdf.save(`Surat_Verifikasi_${doc.token}.pdf`);
    toast.success(`PDF Surat Verifikasi ${doc.token} berhasil diunduh!`);
  };

  // Bulk Export Excel
  const exportToExcel = () => {
    if (docsList.length === 0) {
      toast.warning('Tidak ada data untuk diekspor!');
      return;
    }

    const dataToExport = docsList.map(doc => ({
      'ID Dokumen': doc.id,
      'Token Keamanan': doc.token,
      'Nomor Surat': doc.nomorSurat,
      'Keterangan Surat': doc.keteranganSurat,
      'Tanggal Surat': new Date(doc.tanggal).toLocaleDateString('id-ID'),
      'Nama Pejabat 1': doc.namaPejabat,
      'Jabatan 1': doc.jabatan,
      'Nama Pejabat 2': doc.namaPejabat2 || '-',
      'Jabatan 2': doc.jabatan2 || '-',
      'Tanggal Dibuat': new Date(doc.createdAt).toLocaleDateString('id-ID')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Verifikasi QR');

    // Auto-fit column widths
    const maxLens = {};
    dataToExport.forEach(row => {
      Object.keys(row).forEach(key => {
        const valStr = String(row[key]);
        maxLens[key] = Math.max(maxLens[key] || key.length, valStr.length);
      });
    });
    worksheet['!cols'] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] + 3 }));

    XLSX.writeFile(workbook, `Riwayat_Verifikasi_Dokumen_${Date.now()}.xlsx`);
    toast.success('Daftar riwayat berhasil diekspor ke Excel!');
  };

  // Bulk Export PDF Laporan
  const exportToPdfLaporan = () => {
    if (docsList.length === 0) {
      toast.warning('Tidak ada data untuk diekspor!');
      return;
    }

    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape

    // Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('LAPORAN RIWAYAT VERIFIKASI DOKUMEN & QR-CODE', 148, 15, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Diekspor pada: ${new Date().toLocaleString('id-ID')}`, 148, 20, { align: 'center' });

    // Table Columns
    const tableColumn = ["Token", "Nomor Surat", "Keterangan Dokumen", "Tanggal", "Nama Pejabat 1", "Jabatan 1", "Nama Pejabat 2", "Jabatan 2", "Dibuat Pada"];
    const tableRows = docsList.map(doc => [
      doc.token,
      doc.nomorSurat,
      doc.keteranganSurat,
      new Date(doc.tanggal).toLocaleDateString('id-ID'),
      doc.namaPejabat,
      doc.jabatan,
      doc.namaPejabat2 || '-',
      doc.jabatan2 || '-',
      new Date(doc.createdAt).toLocaleDateString('id-ID')
    ]);

    autoTable(pdf, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' }, // theme Indigo
      styles: { fontSize: 8.5 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [79, 70, 229] }
      }
    });

    pdf.save(`Laporan_Riwayat_Verifikasi_QR_${Date.now()}.pdf`);
    toast.success('Daftar riwayat berhasil diekspor ke PDF!');
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <QrCode className="text-primary w-9 h-9" /> Verifikasi Dokumen
          </h1>
          <p className="text-slate-500 mt-1">Pembuatan QR-Code digital terenkripsi untuk surat keluar dan validasi dokumen resmi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN: FORM GENERATOR */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="shadow-md border-slate-100">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Plus size={18} className="text-primary" /> Buat QR-Code Verifikasi Baru
              </CardTitle>
              <CardDescription>Isi metadata surat secara lengkap untuk melahirkan token QR-code resmi.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isSuperAdmin ? (
                /* SUPER ADMIN ACCESS: SHOW FORM */
                <form onSubmit={handleGenerate} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor Surat</label>
                      <Input
                        placeholder="Contoh: 104/DPN/V/2026"
                        value={nomorSurat}
                        onChange={(e) => setNomorSurat(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Surat</label>
                      <Input
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan Dokumen / Perihal</label>
                    <Input
                      placeholder="Contoh: Surat Keputusan Pengurus Kelulusan Sisya Baru..."
                      value={keteranganSurat}
                      onChange={(e) => setKeteranganSurat(e.target.value)}
                      required
                    />
                  </div>

                  {/* Template Penandatangan Selector */}
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <BookTemplate size={13} className="text-indigo-500" /> Template Penandatangan
                      </label>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setShowTemplateModal(true)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition"
                        >
                          <Settings2 size={12} /> Kelola Template
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
                      >
                        <option value="">(Ketik Manual)</option>
                        {templates.map(tpl => (
                          <option key={tpl.id} value={tpl.id}>{tpl.namaTemplate}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    {selectedTemplateId && (
                      <p className="text-[10px] text-indigo-600 font-medium">✓ Template diterapkan — Anda tetap bisa mengedit field di bawah.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Pejabat Penandatangan 1</label>
                      <Input
                        placeholder="Contoh: Ir. Ida Bagus Arga"
                        value={namaPejabat}
                        onChange={(e) => setNamaPejabat(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jabatan Pejabat 1</label>
                      <Input
                        placeholder="Contoh: Ketua Umum PDPN"
                        value={jabatan}
                        onChange={(e) => setJabatan(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Pejabat Penandatangan 2 (Opsional)</label>
                      <Input
                        placeholder="Contoh: Ida Bagus Anom"
                        value={namaPejabat2}
                        onChange={(e) => setNamaPejabat2(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jabatan Pejabat 2 (Opsional)</label>
                      <Input
                        placeholder="Contoh: Sekretaris Umum PDPN"
                        value={jabatan2}
                        onChange={(e) => setJabatan2(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    {editingDoc ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="font-bold px-6 py-5 rounded-xl border-slate-200"
                          onClick={handleCancelEdit}
                        >
                          Batal
                        </Button>
                        <Button
                          type="submit"
                          className="font-bold px-6 py-5 rounded-xl shadow-lg bg-cyan-600 hover:bg-cyan-700 text-white"
                          disabled={isGenerating}
                        >
                          {isGenerating ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                          Simpan Perubahan
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="submit"
                        className="font-bold px-6 py-5 rounded-xl shadow-lg"
                        disabled={isGenerating}
                      >
                        {isGenerating ? <Loader2 className="animate-spin mr-2" size={18} /> : <QrCode className="mr-2" size={18} />}
                        Generate QR Code
                      </Button>
                    )}
                  </div>
                </form>
              ) : (
                /* ADMIN/STAFF ACCESS: SHOW RBAC WARNING CARD */
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl flex items-start gap-4">
                  <AlertCircle className="shrink-0 text-amber-600 mt-0.5" size={24} />
                  <div>
                    <h4 className="font-bold text-base text-amber-900">Hak Akses Terbatas</h4>
                    <p className="text-sm mt-1 leading-relaxed">
                      Fitur membuat QR-code dokumen resmi baru **hanya dapat diakses oleh tingkat akun SUPER_ADMIN**.
                      Sebagai Admin biasa, Anda hanya memiliki hak akses penuh untuk melakukan pencarian, pemantauan, serta ekspor berkas riwayat di tabel riwayat di bawah ini.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: GENERATOR PREVIEW */}
        <div className="xl:col-span-1">
          {generatedDoc ? (
            <Card className="shadow-md border-slate-100 overflow-hidden border-t-4 border-t-primary animate-in fade-in duration-500">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 text-center py-4">
                <CardTitle className="text-base font-bold text-slate-800">QR-Code Terbit Sukses</CardTitle>
                <div className="mt-1 inline-flex items-center gap-1 bg-primary text-white text-xs px-3 py-0.5 rounded-full font-mono font-bold tracking-wider">
                  TOKEN: {generatedDoc.token}
                </div>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center">
                {/* QR Canvas Render */}
                <div className="border border-slate-200 p-3 bg-white rounded-2xl shadow-sm mb-6">
                  <QRCodeCanvas
                    id={`qr-canvas-${generatedDoc.token}`}
                    value={getVerificationUrl(generatedDoc.token)}
                    size={200}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: '/logo.png',
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="w-full space-y-3">
                  <Button
                    variant="outline"
                    className="w-full font-bold border-slate-200 hover:bg-slate-50"
                    onClick={() => downloadPng(generatedDoc)}
                  >
                    <Download size={16} className="mr-2" /> Unduh Gambar PNG
                  </Button>
                  <Button
                    className="w-full font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => downloadPdfDocument(generatedDoc)}
                  >
                    <FileCheck size={16} className="mr-2" /> Unduh Surat Resmi PDF
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-xs text-slate-500 hover:text-slate-800"
                    onClick={() => setGeneratedDoc(null)}
                  >
                    Tutup Pratonton
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-10 text-center h-full flex flex-col justify-center items-center py-16">
              <QrCode size={48} className="text-slate-300 mb-4" />
              <h4 className="font-bold text-slate-400">Belum Ada QR Baru</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                Silakan isi formulir di sebelah kiri dan klik generate untuk melihat pratonton dan mengunduh stempel QR-code.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MONITORING TABLE SECTION */}
      <Card className="shadow-md border-slate-100">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileCheck size={18} className="text-emerald-600" /> Riwayat & Pemantauan Verifikasi Dokumen
            </CardTitle>
            <CardDescription>Cari, pantau, verifikasi, dan ekspor riwayat QR-code dokumen resmi yang terdaftar.</CardDescription>
          </div>

          {/* Export Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100"
              onClick={exportToExcel}
            >
              <FileSpreadsheet size={14} className="mr-1.5 text-emerald-600" /> Excel
            </Button>
            <Button
              variant="outline"
              className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100"
              onClick={exportToPdfLaporan}
            >
              <FileText size={14} className="mr-1.5 text-red-600" /> PDF Laporan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Table Tools */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Cari Token, No Surat, Pejabat, Keterangan..."
                className="pl-10 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
            </div>
            <Button
              variant="secondary"
              className="font-bold shrink-0 rounded-xl px-5"
              onClick={() => { setPage(1); fetchDocuments(); }}
            >
              Cari
            </Button>
          </div>

          {/* Table Element */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold">Token</th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:text-slate-800" onClick={() => handleSort('nomorSurat')}>
                    Nomor Surat <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="px-6 py-4 font-bold">Keterangan</th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:text-slate-800" onClick={() => handleSort('tanggal')}>
                    Tanggal <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="px-6 py-4 font-bold">Penandatangan</th>
                  <th className="px-6 py-4 font-bold text-center">QR Preview</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingList ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <Loader2 className="animate-spin text-primary mx-auto mb-2" size={24} />
                      <span className="text-slate-400 text-xs">Memuat riwayat dokumen...</span>
                    </td>
                  </tr>
                ) : docsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 text-xs">
                      Tidak ada riwayat dokumen terdaftar.
                    </td>
                  </tr>
                ) : (
                  docsList.map((doc) => (
                    <tr key={doc.token} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-black font-mono text-primary text-xs tracking-wider">{doc.token}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{doc.nomorSurat}</td>
                      <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-500">{doc.keteranganSurat}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {new Date(doc.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-bold text-slate-700">{doc.namaPejabat}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{doc.jabatan}</div>
                        {doc.namaPejabat2 && (
                          <div className="mt-2 pt-2 border-t border-slate-100/50">
                            <div className="font-bold text-slate-700">{doc.namaPejabat2}</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{doc.jabatan2}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {/* Hidden Canvas used for download logic */}
                        <div className="hidden">
                          <QRCodeCanvas
                            id={`qr-canvas-${doc.token}`}
                            value={getVerificationUrl(doc.token)}
                            size={200}
                            level="H"
                            includeMargin={true}
                            imageSettings={{
                              src: '/logo.png',
                              x: undefined,
                              y: undefined,
                              height: 40,
                              width: 40,
                              excavate: true,
                            }}
                          />
                        </div>
                        {/* Small trigger click modal preview */}
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="mx-auto w-8 h-8 rounded-lg border bg-white flex items-center justify-center hover:scale-105 hover:bg-slate-50 transition shadow-sm"
                        >
                          <QrCode size={16} className="text-slate-600" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => downloadPng(doc)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg border border-slate-100 hover:border-emerald-200 transition"
                            title="Unduh PNG"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => downloadPdfDocument(doc)}
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded-lg border border-slate-100 hover:border-indigo-200 transition"
                            title="Unduh PDF Resmi"
                          >
                            <FileText size={14} />
                          </button>
                          <a
                            href={getVerificationUrl(doc.token)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-100 hover:border-slate-300 transition"
                            title="Buka Link Verifikasi"
                          >
                            <ExternalLink size={14} />
                          </a>
                          {isSuperAdmin && (
                            <>
                              <button
                                onClick={() => handleStartEdit(doc)}
                                className="p-1.5 hover:bg-cyan-50 text-cyan-600 hover:text-cyan-700 rounded-lg border border-slate-100 hover:border-cyan-200 transition"
                                title="Edit (Re-generate) Dokumen"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => setDocToDelete(doc)}
                                className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg border border-slate-100 hover:border-red-200 transition"
                                title="Hapus Dokumen secara Permanen"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-6">
              <span className="text-xs text-slate-500">
                Menampilkan halaman <strong className="font-semibold text-slate-700">{page}</strong> dari <strong className="font-semibold text-slate-700">{totalPages}</strong>
              </span>
              <div className="inline-flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-9 border-slate-200 hover:bg-slate-50"
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft size={16} className="mr-1" /> Sebelum
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-9 border-slate-200 hover:bg-slate-50"
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Berikut <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL PREVIEW QR-CODE */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="max-w-sm w-full shadow-2xl border-t-4 border-t-primary overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-sm font-bold text-slate-800">Pratonton QR-Code</CardTitle>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              <div className="inline-flex items-center gap-1 bg-primary text-white text-xs px-3 py-0.5 rounded-full font-mono font-bold tracking-wider mb-4">
                TOKEN: {previewDoc.token}
              </div>

              <div className="border border-slate-200 p-3 bg-white rounded-2xl shadow-sm mb-6">
                <QRCodeCanvas
                  value={getVerificationUrl(previewDoc.token)}
                  size={180}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: '/logo.png',
                    x: undefined,
                    y: undefined,
                    height: 36,
                    width: 36,
                    excavate: true,
                  }}
                />
              </div>

              <div className="text-center w-full space-y-1 mb-5">
                <h4 className="text-sm font-bold text-slate-800 leading-tight mb-2">{previewDoc.nomorSurat}</h4>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2 text-left">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{previewDoc.jabatan}</div>
                    <div className="text-xs text-slate-700 font-black">{previewDoc.namaPejabat}</div>
                  </div>
                  {previewDoc.namaPejabat2 && (
                    <div className="border-t border-slate-200/50 pt-2">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{previewDoc.jabatan2}</div>
                      <div className="text-xs text-slate-700 font-black">{previewDoc.namaPejabat2}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs font-bold border-slate-200"
                  onClick={() => { downloadPng(previewDoc); setPreviewDoc(null); }}
                >
                  <Download size={14} className="mr-1" /> Gambar
                </Button>
                <Button
                  className="flex-1 text-xs font-bold shadow bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => { downloadPdfDocument(previewDoc); setPreviewDoc(null); }}
                >
                  <FileText size={14} className="mr-1" /> Surat PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. MODAL KONFIRMASI HAPUS PERMANEN (SUPER_ADMIN ONLY) */}
      {docToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-red-100 overflow-hidden transform scale-100 transition-all p-6 space-y-6">
            <div className="flex items-center gap-4 text-red-600 bg-red-50 p-4 rounded-xl">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base uppercase tracking-wide">Hapus Dokumen Permanen</h3>
                <p className="text-[10px] text-red-700/80 font-bold uppercase tracking-wider">Keamanan Tingkat Tinggi</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 text-xs leading-relaxed">
                Peringatan! Anda akan menghapus dokumen dengan Token <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">"{docToDelete.token}"</span> secara permanen dari server database PDPN.
              </p>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs text-slate-500">
                <div><span className="font-bold text-slate-700">Nomor Surat:</span> {docToDelete.nomorSurat}</div>
                <div className="truncate"><span className="font-bold text-slate-700">Keterangan:</span> {docToDelete.keteranganSurat}</div>
                {docToDelete.modifiedBy && (
                  <div className="text-[10px] text-amber-600 mt-1 border-t border-slate-100 pt-1">
                    <span className="font-bold">Diubah oleh:</span> {docToDelete.modifiedBy} pada {new Date(docToDelete.modifiedAt).toLocaleString('id-ID')}
                  </div>
                )}
              </div>
              <p className="text-red-600 text-[11px] font-semibold leading-relaxed">
                * Setelah dokumen dihapus, pemindaian QR-code fisik yang telah tercetak akan langsung dideteksi sebagai <strong>DOKUMEN PALSU/TIDAK VALID</strong>. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                className="flex-1 font-bold border-slate-200 rounded-xl"
                onClick={() => setDocToDelete(null)}
              >
                Batal
              </Button>
              <Button
                className="flex-1 font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-100"
                onClick={handleConfirmDelete}
              >
                Ya, Hapus Permanen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL KONFIRMASI RE-GENERATE / UPDATE (SUPER_ADMIN ONLY) */}
      {pendingUpdatePayload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-amber-100 overflow-hidden transform scale-100 transition-all p-6 space-y-6">
            <div className="flex items-center gap-4 text-amber-600 bg-amber-50 p-4 rounded-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Save size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base uppercase tracking-wide">Konfirmasi Re-generate</h3>
                <p className="text-[10px] text-amber-700/80 font-bold uppercase tracking-wider">Keamanan Tingkat Tinggi</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 text-xs leading-relaxed">
                Anda akan memperbarui (re-generate) metadata untuk dokumen dengan Token <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">"{editingDoc?.token}"</span> di database resmi PDPN.
              </p>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs text-slate-500">
                <div><span className="font-bold text-slate-700">No Surat Baru:</span> {pendingUpdatePayload.nomorSurat}</div>
                <div className="truncate"><span className="font-bold text-slate-700">Keterangan Baru:</span> {pendingUpdatePayload.keteranganSurat}</div>
              </div>
              <p className="text-amber-700 text-[11px] font-semibold leading-relaxed">
                * Perubahan metadata akan langsung berlaku real-time di server. Seluruh pemindaian QR-code di masa depan akan langsung mencerminkan data baru ini.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                className="flex-1 font-bold border-slate-200 rounded-xl"
                onClick={() => setPendingUpdatePayload(null)}
              >
                Batal
              </Button>
              <Button
                className="flex-1 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-100"
                onClick={handleConfirmUpdate}
              >
                Ya, Perbarui
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* 6. MODAL KELOLA TEMPLATE PENANDATANGAN (SUPER_ADMIN ONLY) */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-indigo-100 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <BookTemplate size={18} className="text-indigo-500" /> Kelola Template Penandatangan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Buat, edit, dan hapus template pejabat penandatangan.</p>
              </div>
              <button
                onClick={() => { setShowTemplateModal(false); handleCancelEditTemplate(); }}
                className="text-slate-400 hover:text-slate-700 transition p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Form */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {editingTemplate ? `Edit: ${editingTemplate.namaTemplate}` : 'Tambah Template Baru'}
                </h4>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Template</label>
                  <Input
                    placeholder="Contoh: Surat Antar Bidang — Ketua & Sekretaris Umum"
                    value={templateForm.namaTemplate}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, namaTemplate: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Pejabat 1</label>
                    <Input
                      placeholder="Contoh: Ir. Ida Bagus Arga"
                      value={templateForm.namaPejabat}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, namaPejabat: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jabatan 1</label>
                    <Input
                      placeholder="Contoh: Ketua Umum PDPN"
                      value={templateForm.jabatan}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, jabatan: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Pejabat 2 (Opsional)</label>
                    <Input
                      placeholder="Contoh: Ida Bagus Anom"
                      value={templateForm.namaPejabat2}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, namaPejabat2: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jabatan 2 (Opsional)</label>
                    <Input
                      placeholder="Contoh: Sekretaris Umum PDPN"
                      value={templateForm.jabatan2}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, jabatan2: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  {editingTemplate && (
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs font-bold border-slate-200 rounded-lg"
                      onClick={handleCancelEditTemplate}
                    >
                      Batal Edit
                    </Button>
                  )}
                  <Button
                    type="button"
                    className="text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow"
                    onClick={handleSaveTemplate}
                    disabled={isSavingTemplate}
                  >
                    {isSavingTemplate ? <Loader2 className="animate-spin mr-1.5" size={14} /> : <Save className="mr-1.5" size={14} />}
                    {editingTemplate ? 'Simpan Perubahan' : 'Tambah Template'}
                  </Button>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template Tersimpan ({templates.length})</h4>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    Belum ada template. Buat template pertama di atas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map(tpl => (
                      <div key={tpl.id} className="p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 transition group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-slate-800 truncate">{tpl.namaTemplate}</div>
                            <div className="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                              <div><span className="font-semibold text-slate-600">Pejabat 1:</span> {tpl.namaPejabat} — <span className="italic">{tpl.jabatan}</span></div>
                              {tpl.namaPejabat2 && (
                                <div><span className="font-semibold text-slate-600">Pejabat 2:</span> {tpl.namaPejabat2} — <span className="italic">{tpl.jabatan2}</span></div>
                              )}
                            </div>
                          </div>
                          <div className="inline-flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEditTemplate(tpl)}
                              className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg border border-slate-100 hover:border-indigo-200 transition"
                              title="Edit Template"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg border border-slate-100 hover:border-red-200 transition"
                              title="Hapus Template"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex justify-end">
              <Button
                variant="outline"
                className="font-bold border-slate-200 rounded-xl"
                onClick={() => { setShowTemplateModal(false); handleCancelEditTemplate(); }}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
