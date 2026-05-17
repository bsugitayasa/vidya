import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Calendar, BookOpen, Check, Edit2, X, Camera, Users, GraduationCap, ClipboardList, FileDown } from 'lucide-react';
import api from '../../../lib/axios';
import { Button } from '../../../components/ui/button';
import { getProgramBadgeStyle } from '../../../lib/utils';
import useAuthStore from '../../../store/authStore';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import DokumentasiUpload from '../../../components/ui/DokumentasiUpload';

const STATUS_OPTIONS = [
  { value: 'HADIR', label: 'H', color: 'bg-green-500', hoverBg: 'hover:bg-green-100', activeBg: 'bg-green-100 ring-2 ring-green-500', textColor: 'text-green-700' },
  { value: 'IZIN', label: 'I', color: 'bg-blue-500', hoverBg: 'hover:bg-blue-100', activeBg: 'bg-blue-100 ring-2 ring-blue-500', textColor: 'text-blue-700' },
  { value: 'SAKIT', label: 'S', color: 'bg-yellow-500', hoverBg: 'hover:bg-yellow-100', activeBg: 'bg-yellow-100 ring-2 ring-yellow-500', textColor: 'text-yellow-700' },
  { value: 'ALPHA', label: 'A', color: 'bg-red-500', hoverBg: 'hover:bg-red-100', activeBg: 'bg-red-100 ring-2 ring-red-500', textColor: 'text-red-700' },
];

export default function SesiAbsensi() {
  const { sesiId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [sesiData, setSesiData] = useState(null);
  const [absensiState, setAbsensiState] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasChanges, setHasChanges] = useState(false);

  // Edit tanggal state (Super Admin)
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editTanggal, setEditTanggal] = useState('');
  const [isSavingDate, setIsSavingDate] = useState(false);

  // Edit topik state (Super Admin)
  const [isEditingTopik, setIsEditingTopik] = useState(false);
  const [editTopik, setEditTopik] = useState('');
  const [isSavingTopik, setIsSavingTopik] = useState(false);

  useEffect(() => {
    fetchSesiDetail();
  }, [sesiId]);

  const fetchSesiDetail = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/absensi/sesi/${sesiId}`);
      if (res.data.success) {
        setSesiData(res.data.data);
        // Inisialisasi state absensi
        const initialState = {};
        res.data.data.daftarSisya?.forEach(sisya => {
          initialState[sisya.sisyaId] = sisya.status || null;
        });
        setAbsensiState(initialState);
      }
    } catch (error) {
      console.error('Error fetching sesi:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data sesi' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (sisyaId, status) => {
    setAbsensiState(prev => ({
      ...prev,
      [sisyaId]: prev[sisyaId] === status ? null : status
    }));
    setHasChanges(true);
  };

  const setAllStatus = (status) => {
    const newState = {};
    sesiData?.daftarSisya?.forEach(sisya => {
      newState[sisya.sisyaId] = status;
    });
    setAbsensiState(newState);
    setHasChanges(true);
  };

  // Confirm dialog state for Set Semua
  const [confirmSetAll, setConfirmSetAll] = useState({ open: false, status: '' });

  const handleSave = async () => {
    // Hanya kirim sisya yang sudah diberi status
    const absensi = Object.entries(absensiState)
      .filter(([_, status]) => status !== null)
      .map(([sisyaId, status]) => ({
        sisyaId: parseInt(sisyaId),
        status
      }));

    if (absensi.length === 0) {
      setMessage({ type: 'error', text: 'Pilih status kehadiran minimal untuk 1 sisya' });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post(`/absensi/sesi/${sesiId}/input`, { absensi });
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        setHasChanges(false);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menyimpan absensi';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDate = async () => {
    if (!editTanggal) return;
    setIsSavingDate(true);
    try {
      const res = await api.patch(`/absensi/sesi/${sesiId}`, { tanggal: editTanggal });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Tanggal sesi berhasil diperbarui' });
        setIsEditingDate(false);
        fetchSesiDetail();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal memperbarui tanggal';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleSaveTopik = async () => {
    setIsSavingTopik(true);
    try {
      const res = await api.patch(`/absensi/sesi/${sesiId}`, { topik: editTopik });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Topik sesi berhasil diperbarui' });
        setIsEditingTopik(false);
        fetchSesiDetail();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal memperbarui topik';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSavingTopik(false);
    }
  };

  const handleDokUploadSuccess = (data) => {
    setSesiData(prev => ({
      ...prev,
      ...data
    }));
    setMessage({ type: 'success', text: 'Dokumentasi berhasil diunggah' });
  };

  const handleDokDeleteSuccess = (fieldName) => {
    const pathMap = {
      dokSisya: 'dokSisyaPath',
      dokNarawak: 'dokNarawakPath',
      dokPanitia: 'dokPanitiaPath'
    };
    setSesiData(prev => ({
      ...prev,
      [pathMap[fieldName]]: null
    }));
    setMessage({ type: 'success', text: 'Dokumentasi berhasil dihapus' });
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const autoTable = autoTableModule.default;

    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // Helper: fetch protected image as base64 data URL
    const fetchImageAsBase64 = async (filePath) => {
      try {
        const filename = filePath.split('/').pop();
        const response = await api.get(`/sisya/files/${filename}`, { responseType: 'blob' });
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(response.data);
        });
      } catch {
        return null;
      }
    };

    // ── Header ──
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REKAPITULASI ABSENSI', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SEKSI PENDIDIKAN & PENGAJARAN KEBRAHMANAN PDPN', pageWidth / 2, 24, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Pasraman Dharma Wasitha Capung Mas Ubud Gianyar', pageWidth / 2, 30, { align: 'center' });

    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(0.5);
    doc.line(margin, 33, pageWidth - margin, 33);

    // ── Info Sesi ──
    let y = 39;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Program Ajahan', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${sesiData.mataKuliah.programAjahan?.nama || '-'}`, margin + 42, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Mata Ajah', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${sesiData.mataKuliah.nama} (${sesiData.mataKuliah.kode || ''})`, margin + 42, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Pertemuan', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`: Pertemuan ke-${sesiData.pertemuan}`, margin + 42, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Tanggal', margin, y);
    doc.setFont('helvetica', 'normal');
    const tanggalStr = new Date(sesiData.tanggal).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    doc.text(`: ${tanggalStr}`, margin + 42, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Topik', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${sesiData.topik || '-'}`, margin + 42, y);

    // ── Statistik ──
    y += 10;
    doc.setFillColor(245, 245, 255);
    doc.roundedRect(margin, y - 4, pageWidth - (margin * 2), 12, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const statsText = `Hadir: ${stats.hadir}    Izin: ${stats.izin}    Sakit: ${stats.sakit}    Alpha: ${stats.alpha}    Belum: ${stats.belum}    |    Total: ${sesiData.daftarSisya?.length || 0} sisya`;
    doc.text(statsText, pageWidth / 2, y + 2, { align: 'center' });

    y += 14;

    // ── Tabel Absensi ──
    const tableData = (sesiData.daftarSisya || []).map((sisya, index) => {
      const status = absensiState[sisya.sisyaId];
      let statusLabel = '-';
      if (status === 'HADIR') statusLabel = 'HADIR';
      else if (status === 'IZIN') statusLabel = 'IZIN';
      else if (status === 'SAKIT') statusLabel = 'SAKIT';
      else if (status === 'ALPHA') statusLabel = 'ALPHA';
      return [index + 1, sisya.namaLengkap, sisya.namaGriya, statusLabel];
    });

    autoTable(doc, {
      startY: y,
      head: [['No', 'Nama Sisya', 'Griya', 'Status']],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [124, 58, 237],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 45 },
        3: { halign: 'center', cellWidth: 25 }
      },
      bodyStyles: {
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const val = data.cell.raw;
          if (val === 'HADIR') data.cell.styles.textColor = [22, 163, 74];
          else if (val === 'IZIN') data.cell.styles.textColor = [37, 99, 235];
          else if (val === 'SAKIT') data.cell.styles.textColor = [202, 138, 4];
          else if (val === 'ALPHA') data.cell.styles.textColor = [220, 38, 38];
          else data.cell.styles.textColor = [156, 163, 175];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // ── Footer & Tanda Tangan ──
    const finalY = doc.lastAutoTable.finalY + 12;
    const signatureX = pageWidth - margin - 60;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, finalY);

    doc.text('Mengetahui,', signatureX, finalY);
    doc.text('Koordinator Program', signatureX, finalY + 5);
    doc.line(signatureX, finalY + 22, signatureX + 50, finalY + 22);

    // ── Dokumentasi KBM ──
    const dokList = [
      { path: sesiData.dokSisyaPath, label: 'Dokumentasi Sisya' },
      { path: sesiData.dokNarawakPath, label: 'Dokumentasi Narawakya' },
      { path: sesiData.dokPanitiaPath, label: 'Dokumentasi Panitia/Kordinator' },
    ].filter(d => d.path);

    if (dokList.length > 0) {
      doc.addPage();

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('DOKUMENTASI KEGIATAN BELAJAR MENGAJAR', pageWidth / 2, 18, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${sesiData.mataKuliah.nama} — Pertemuan ${sesiData.pertemuan} — ${tanggalStr}`, pageWidth / 2, 24, { align: 'center' });

      doc.setDrawColor(124, 58, 237);
      doc.setLineWidth(0.5);
      doc.line(margin, 28, pageWidth - margin, 28);

      let dokY = 36;
      const imgMaxWidth = pageWidth - (margin * 2);
      const imgMaxHeight = 70;

      for (const dok of dokList) {
        const ext = dok.path.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
        const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(ext);

        // Check if we need a new page
        if (dokY + imgMaxHeight + 16 > pageHeight - 10) {
          doc.addPage();
          dokY = 18;
        }

        // Label
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(124, 58, 237);
        doc.text(dok.label, margin, dokY);
        doc.setTextColor(0, 0, 0);
        dokY += 3;

        if (isImage) {
          try {
            const base64 = await fetchImageAsBase64(dok.path);
            if (base64) {
              const format = ext === 'png' ? 'PNG' : 'JPEG';

              // Create temp image to get dimensions
              const img = new Image();
              await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
                img.src = base64;
              });

              // Calculate scaled dimensions to fit
              let imgW = imgMaxWidth;
              let imgH = (img.height / img.width) * imgW;
              if (imgH > imgMaxHeight) {
                imgH = imgMaxHeight;
                imgW = (img.width / img.height) * imgH;
              }

              const imgX = margin + (imgMaxWidth - imgW) / 2;

              doc.setDrawColor(220, 220, 220);
              doc.setLineWidth(0.3);
              doc.roundedRect(imgX - 1, dokY - 1, imgW + 2, imgH + 2, 1, 1, 'S');

              doc.addImage(base64, format, imgX, dokY, imgW, imgH);
              dokY += imgH + 10;
            } else {
              doc.setFontSize(9);
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(150, 150, 150);
              doc.text('(Gagal memuat gambar)', margin, dokY + 4);
              doc.setTextColor(0, 0, 0);
              dokY += 12;
            }
          } catch {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text('(Gagal memuat gambar)', margin, dokY + 4);
            doc.setTextColor(0, 0, 0);
            dokY += 12;
          }
        } else if (isVideo) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 100, 100);
          const videoFilename = dok.path.split('/').pop();
          doc.text(`[Video: ${videoFilename}] — Video tidak dapat ditampilkan di PDF`, margin, dokY + 4);
          doc.setTextColor(0, 0, 0);
          dokY += 12;
        } else {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 100, 100);
          const docFilename = dok.path.split('/').pop();
          doc.text(`[File: ${docFilename}]`, margin, dokY + 4);
          doc.setTextColor(0, 0, 0);
          dokY += 12;
        }
      }
    }

    // ── Save ──
    const mkCode = sesiData.mataKuliah.kode || 'MK';
    const fileName = `Absensi-${mkCode}-P${sesiData.pertemuan}-${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };
  // Hitung statistik
  const stats = {
    hadir: Object.values(absensiState).filter(s => s === 'HADIR').length,
    izin: Object.values(absensiState).filter(s => s === 'IZIN').length,
    sakit: Object.values(absensiState).filter(s => s === 'SAKIT').length,
    alpha: Object.values(absensiState).filter(s => s === 'ALPHA').length,
    belum: Object.values(absensiState).filter(s => s === null).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-muted">
        <Loader2 className="animate-spin mr-2" size={20} />
        Memuat data sesi...
      </div>
    );
  }

  if (!sesiData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <button
            onClick={() => navigate(`/admin/absensi/${sesiData.mataKuliah.id}`)}
            className="flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors mb-3"
          >
            <ArrowLeft size={16} /> Kembali ke {sesiData.mataKuliah.nama}
          </button>
          <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2">
            <BookOpen size={28} />
            Input Absensi — Pertemuan {sesiData.pertemuan}
          </h2>
          <div className="flex flex-wrap gap-3 mt-2">
            {isEditingDate ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={editTanggal}
                  onChange={(e) => setEditTanggal(e.target.value)}
                  className="text-sm border border-muted/30 rounded-md px-2 py-1 focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <button
                  onClick={handleSaveDate}
                  disabled={isSavingDate}
                  className="w-7 h-7 rounded-md flex items-center justify-center bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                  title="Simpan"
                >
                  {isSavingDate ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => setIsEditingDate(false)}
                  className="w-7 h-7 rounded-md flex items-center justify-center bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  title="Batal"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <span className="text-sm text-muted flex items-center gap-1">
                <Calendar size={14} />
                {new Date(sesiData.tanggal).toLocaleDateString('id-ID', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setEditTanggal(new Date(sesiData.tanggal).toISOString().split('T')[0]);
                      setIsEditingDate(true);
                    }}
                    className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition-colors"
                    title="Edit Tanggal"
                  >
                    <Edit2 size={10} /> Edit
                  </button>
                )}
              </span>
            )}
            {isEditingTopik ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTopik}
                  onChange={(e) => setEditTopik(e.target.value)}
                  placeholder="Topik pertemuan..."
                  className="text-sm border border-muted/30 rounded-md px-2 py-1 focus:ring-2 focus:ring-primary/20 outline-none min-w-[200px]"
                />
                <button
                  onClick={handleSaveTopik}
                  disabled={isSavingTopik}
                  className="w-7 h-7 rounded-md flex items-center justify-center bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                  title="Simpan"
                >
                  {isSavingTopik ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => setIsEditingTopik(false)}
                  className="w-7 h-7 rounded-md flex items-center justify-center bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  title="Batal"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <span className="text-sm text-muted">
                Topik: <strong className="text-text">{sesiData.topik || '-'}</strong>
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setEditTopik(sesiData.topik || '');
                      setIsEditingTopik(true);
                    }}
                    className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition-colors"
                    title="Edit Topik"
                  >
                    <Edit2 size={10} /> Edit
                  </button>
                )}
              </span>
            )}
            <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium border ${getProgramBadgeStyle(sesiData.mataKuliah.programAjahan?.nama)}`}>
              {sesiData.mataKuliah.programAjahan?.nama}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
            title="Export PDF untuk print"
          >
            <FileDown size={16} />
            Export PDF
          </button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Menyimpan...' : 'Simpan Absensi'}
          </Button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md text-sm border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
          {message.text}
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700">Hadir: {stats.hadir}</span>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-blue-700">Izin: {stats.izin}</span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-sm font-medium text-yellow-700">Sakit: {stats.sakit}</span>
        </div>
        <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm font-medium text-red-700">Alpha: {stats.alpha}</span>
        </div>
        {stats.belum > 0 && (
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-sm font-medium text-gray-500">Belum: {stats.belum}</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted self-center mr-1">Set semua:</span>
        {STATUS_OPTIONS?.map(opt => (
          <button
            key={opt.value}
            onClick={() => setConfirmSetAll({ open: true, status: opt.value })}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${opt.hoverBg} ${opt.textColor} border-current/20`}
          >
            Semua {opt.value}
          </button>
        ))}
      </div>

      <ConfirmDialog
        open={confirmSetAll.open}
        title={`Set Semua ${confirmSetAll.status}?`}
        message={`Status kehadiran seluruh sisya pada pertemuan ini akan diubah menjadi "${confirmSetAll.status}". Perubahan belum tersimpan sampai Anda klik Simpan Absensi.`}
        confirmLabel="Ya, Set Semua"
        variant="warning"
        onConfirm={() => {
          setAllStatus(confirmSetAll.status);
          setConfirmSetAll({ open: false, status: '' });
        }}
        onCancel={() => setConfirmSetAll({ open: false, status: '' })}
      />

      {/* Table */}
      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/5 border-b border-muted/20">
                <th className="p-4 font-semibold text-sm text-text text-center w-12">No</th>
                <th className="p-4 font-semibold text-sm text-text">Nama Sisya</th>
                <th className="p-4 font-semibold text-sm text-text">Griya</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {!sesiData?.daftarSisya || sesiData.daftarSisya.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-muted">
                    Tidak ada sisya aktif di program ini. Pastikan status sisya sudah diubah ke AKTIF atau MEDIKSA.
                  </td>
                </tr>
              ) : (
                sesiData.daftarSisya.map((sisya, index) => (
                  <tr key={sisya.sisyaId} className="hover:bg-bg/50 transition-colors">
                    <td className="p-4 text-sm text-center text-muted">{index + 1}</td>
                    <td className="p-4 text-sm font-medium">{sisya.namaLengkap}</td>
                    <td className="p-4 text-sm text-muted">{sisya.namaGriya}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {STATUS_OPTIONS?.map(opt => {
                          const isActive = absensiState[sisya.sisyaId] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusChange(sisya.sisyaId, opt.value)}
                              className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${isActive
                                ? `${opt.activeBg} ${opt.textColor} scale-110`
                                : `bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-200`
                                }`}
                              title={opt.value}
                            >
                              {isActive && <Check size={12} className="inline mr-0.5" />}
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dokumentasi KBM Section */}
      <div className="mt-6">
        <h3 className="text-lg font-bold font-heading text-text flex items-center gap-2 mb-4">
          <Camera size={20} className="text-primary" />
          Dokumentasi KBM
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DokumentasiUpload
            label="Dokumentasi Sisya"
            icon={Users}
            fieldName="dokSisya"
            existingPath={sesiData.dokSisyaPath}
            sesiId={sesiId}
            onUploadSuccess={handleDokUploadSuccess}
            onDeleteSuccess={handleDokDeleteSuccess}
            isSuperAdmin={isSuperAdmin}
          />
          <DokumentasiUpload
            label="Dokumentasi Narawakya"
            icon={GraduationCap}
            fieldName="dokNarawak"
            existingPath={sesiData.dokNarawakPath}
            sesiId={sesiId}
            onUploadSuccess={handleDokUploadSuccess}
            onDeleteSuccess={handleDokDeleteSuccess}
            isSuperAdmin={isSuperAdmin}
          />
          <DokumentasiUpload
            label="Dokumentasi Panitia"
            icon={ClipboardList}
            fieldName="dokPanitia"
            existingPath={sesiData.dokPanitiaPath}
            sesiId={sesiId}
            onUploadSuccess={handleDokUploadSuccess}
            onDeleteSuccess={handleDokDeleteSuccess}
            isSuperAdmin={isSuperAdmin}
          />
        </div>
      </div>

      {/* Floating Save Button (mobile) */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="shadow-lg rounded-full px-6 py-3 flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan
          </Button>
        </div>
      )}
    </div>
  );
}
