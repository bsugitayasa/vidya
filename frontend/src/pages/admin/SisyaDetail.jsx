import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, User, CreditCard, ExternalLink, Trash2, Download, Edit2, Upload, BookOpen, AlertTriangle } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useFileUrl from '../../hooks/useFileUrl';
import { getProgramBadgeStyle } from '../../lib/utils';
import useAuthStore from '../../store/authStore';
import { normalizeName } from '../../lib/normalizeName';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Loader2 } from 'lucide-react';

const sisyaUpdateSchema = z.object({
  namaLengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  tempatLahir: z.string().min(2, 'Tempat lahir wajib diisi'),
  tanggalLahir: z.string().or(z.date()),
  jenisKelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN'], {
    errorMap: () => ({ message: 'Jenis kelamin harus LAKI_LAKI atau PEREMPUAN' })
  }),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  noHp: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .transform(val => {
      if (val.startsWith('62')) return '0' + val.substring(2);
      return val;
    })
    .refine(val => /^08\d+$/.test(val), "Nomor HP harus diawali dengan 08")
    .refine(val => val.length >= 10, "Nomor HP minimal 10 digit"),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  namaGriya: z.string().min(2, 'Nama Griya wajib diisi'),
  namaDesa: z.string().min(2, 'Nama Desa wajib diisi')
});

export default function SisyaDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [sisya, setSisya] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  // Modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedPembayaran, setSelectedPembayaran] = useState(null);
  const [nominalVerifikasi, setNominalVerifikasi] = useState('');
  const [keteranganVerifikasi, setKeteranganVerifikasi] = useState('');
  const [tanggalVerifikasi, setTanggalVerifikasi] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Registration Number Edit state
  const [showEditRegModal, setShowEditRegModal] = useState(false);
  const [selectedSp, setSelectedSp] = useState(null);
  const [newNomorRegistrasi, setNewNomorRegistrasi] = useState('');

  // Upload Bukti Bayar state (Super Admin)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadKeterangan, setUploadKeterangan] = useState('');

  // Edit Program Ajahan state (Super Admin)
  const [showEditProgramModal, setShowEditProgramModal] = useState(false);
  const [allPrograms, setAllPrograms] = useState([]);
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [showConfirmProgramEdit, setShowConfirmProgramEdit] = useState(false);
  const [isSavingPrograms, setIsSavingPrograms] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Link Partner state (Super Admin)
  const [showLinkPartnerModal, setShowLinkPartnerModal] = useState(false);
  const [partnerQuery, setPartnerQuery] = useState('');
  const [partnerResults, setPartnerResults] = useState([]);
  const [isSearchingPartner, setIsSearchingPartner] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isLinking, setIsLinking] = useState(false);

  const [showEditPembayaranModal, setShowEditPembayaranModal] = useState(false);
  const [selectedEditPembayaran, setSelectedEditPembayaran] = useState(null);
  const [editNominal, setEditNominal] = useState('');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [editTanggalBayar, setEditTanggalBayar] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(sisyaUpdateSchema),
    mode: 'onTouched'
  });

  const [showSoftDeleteConfirm, setShowSoftDeleteConfirm] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const tanggalLahirVal = watch('tanggalLahir');

  useEffect(() => {
    if (tanggalLahirVal && typeof tanggalLahirVal === 'string' && !selectedDate) {
      const parts = tanggalLahirVal.split('-');
      if (parts.length === 3) {
        setSelectedDate(new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]));
      }
    }
  }, [tanggalLahirVal]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setValue('tanggalLahir', `${year}-${month}-${day}`, { shouldValidate: true });
    } else {
      setValue('tanggalLahir', '', { shouldValidate: true });
    }
  };

  const handleOpenEditPembayaranModal = (p) => {
    setSelectedEditPembayaran(p);
    setEditNominal(p.nominal.toString());
    setEditKeterangan(p.keterangan || '');
    setEditTanggalBayar(p.tanggalBayar ? new Date(p.tanggalBayar).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setShowEditPembayaranModal(true);
  };

  const handleEditPembayaranSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEditPembayaran || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const response = await api.patch(`/pembayaran/${selectedEditPembayaran.id}/edit`, {
        nominal: parseFloat(editNominal),
        keterangan: editKeterangan,
        tanggalBayar: editTanggalBayar
      });
      
      toast.success(response.data.message || 'Pembayaran berhasil diupdate');
      setShowEditPembayaranModal(false);
      fetchSisyaDetail();
    } catch (error) {
      console.error('Error updating pembayaran:', error);
      toast.error(error.response?.data?.message || 'Gagal mengupdate pembayaran');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenEditModal = () => {
    reset({
      namaLengkap: sisya.namaLengkap,
      tempatLahir: sisya.tempatLahir,
      tanggalLahir: new Date(sisya.tanggalLahir).toISOString().split('T')[0],
      jenisKelamin: sisya.jenisKelamin,
      alamat: sisya.alamat,
      noHp: sisya.noHp,
      email: sisya.email || '',
      namaGriya: sisya.namaGriya,
      namaDesa: sisya.namaDesa,
    });
    const d = new Date(sisya.tanggalLahir);
    setSelectedDate(d);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (data) => {
    setIsUpdating(true);
    try {
      const res = await api.put(`/sisya/${id}`, data);
      if (res.data.success) {
        toast.success('Data sisya berhasil diperbarui');
        setShowEditModal(false);
        fetchSisyaDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui data');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenEditRegModal = (sp) => {
    setSelectedSp(sp);
    setNewNomorRegistrasi(sp.nomorRegistrasi || '');
    setShowEditRegModal(true);
  };

  const handleUpdateReg = async () => {
    if (!newNomorRegistrasi) return;
    setIsUpdating(true);
    try {
      const res = await api.patch(`/sisya/program/${selectedSp.id}`, {
        nomorRegistrasi: newNomorRegistrasi
      });
      if (res.data.success) {
        toast.success('Nomor registrasi berhasil diperbarui');
        setShowEditRegModal(false);
        fetchSisyaDetail();
      }
    } catch (err) {
      toast.error('Gagal memperbarui nomor registrasi');
    } finally {
      setIsUpdating(false);
    }
  };

  // ---- Edit Program Ajahan Handlers ----
  const handleOpenEditProgramModal = async () => {
    setIsLoadingPrograms(true);
    try {
      const res = await api.get('/program-ajahan');
      if (res.data.success) {
        setAllPrograms(res.data.data);
        // Pre-select programs the sisya is already enrolled in
        const current = sisya.programSisyas.map(sp => ({
          programAjahanId: sp.programAjahanId,
          isPasangan: sp.isPasangan
        }));
        setSelectedPrograms(current);
        setShowEditProgramModal(true);
      }
    } catch (err) {
      toast.error('Gagal memuat daftar program ajahan');
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const isProgramSelected = (programId) => {
    return selectedPrograms.some(p => p.programAjahanId === programId);
  };

  const toggleProgramSelection = (programId) => {
    if (isProgramSelected(programId)) {
      setSelectedPrograms(prev => prev.filter(p => p.programAjahanId !== programId));
    } else {
      setSelectedPrograms(prev => [...prev, { programAjahanId: programId, isPasangan: false }]);
    }
  };

  const toggleProgramPasangan = (programId) => {
    setSelectedPrograms(prev => prev.map(p =>
      p.programAjahanId === programId ? { ...p, isPasangan: !p.isPasangan } : p
    ));
  };

  const calculateNewTotalPunia = () => {
    return selectedPrograms.reduce((total, sp) => {
      const prog = allPrograms.find(p => p.id === sp.programAjahanId);
      if (!prog) return total;
      const isPasangan = sp.isPasangan && prog.isPasanganTersedia;
      const price = (isPasangan && prog.puniaPasangan) ? prog.puniaPasangan : prog.puniaNormal;
      return total + price;
    }, 0);
  };

  const handleConfirmProgramEdit = () => {
    if (selectedPrograms.length === 0) {
      toast.error('Minimal harus memilih 1 program ajahan');
      return;
    }
    setShowConfirmProgramEdit(true);
  };

  const handleSaveProgramEdit = async () => {
    setIsSavingPrograms(true);
    try {
      const res = await api.patch(`/sisya/${id}/programs`, {
        programs: selectedPrograms
      });
      if (res.data.success) {
        toast.success('Program ajahan berhasil diperbarui');
        setShowEditProgramModal(false);
        setShowConfirmProgramEdit(false);
        fetchSisyaDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui program ajahan');
    } finally {
      setIsSavingPrograms(false);
    }
  };

  // Protected file URLs
  const fotoUrl = useFileUrl(sisya?.fileFotoPath);
  const ktpUrl = useFileUrl(sisya?.fileIdentitasPath);
  const rekomendasiUrl = useFileUrl(sisya?.fileRekomendasiPath);

  const handleSoftDelete = async () => {
    setIsUpdating(true);
    try {
      const res = await api.delete(`/sisya/${id}/soft-delete`);
      if (res.data.success) {
        toast.success('Data sisya berhasil dinonaktifkan');
        setShowSoftDeleteConfirm(false);
        fetchSisyaDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menonaktifkan data');
    } finally {
      setIsUpdating(false);
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
        reader.onerror = () => reject(new Error("Gagal membaca blob gambar"));
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('Gagal mengambil base64 logo:', err);
      return null;
    }
  };

  const handleDownloadPdfForm = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      let logoBase64 = null;
      try {
        logoBase64 = await getBase64ImageFromUrl('/logo.png');
      } catch (err) {
        console.error('Gagal memuat logo untuk PDF:', err);
      }

      if (logoBase64) {
        pdf.addImage(logoBase64, 'PNG', 20, 12, 17, 17);
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
        pdf.setTextColor(0, 0, 0);
      } else {
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
        pdf.setTextColor(0, 0, 0);
      }

      pdf.setLineWidth(0.8);
      pdf.line(20, 33, 190, 33);
      pdf.setLineWidth(0.2);
      pdf.line(20, 34, 190, 34);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('FORMULIR REGISTRASI SISYA', 105, 45, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`No. Pendaftaran: ${sisya.nomorPendaftaran}`, 105, 51, { align: 'center' });

      // Data Pribadi
      let startY = 55;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('A. DATA PRIBADI', 20, startY);

      autoTable(pdf, {
        startY: startY + 2,
        theme: 'plain',
        head: [],
        body: [
          ['Nama Lengkap', ':', sisya.namaLengkap],
          ['Tempat, Tanggal Lahir', ':', `${sisya.tempatLahir}, ${new Date(sisya.tanggalLahir).toLocaleDateString('id-ID')}`],
          ['Jenis Kelamin', ':', sisya.jenisKelamin === 'LAKI_LAKI' ? 'Laki-Laki' : 'Perempuan'],
          ['Alamat', ':', sisya.alamat],
          ['Nomor HP', ':', sisya.noHp],
          ['Email', ':', sisya.email || '-'],
          ['Nama Griya', ':', sisya.namaGriya],
          ['Nama Desa', ':', sisya.namaDesa]
        ],
        styles: { fontSize: 9, cellPadding: 1 },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold' },
          1: { cellWidth: 5 },
          2: { cellWidth: 100 }
        },
        margin: { left: 20 }
      });

      // Program Ajahan
      startY = pdf.lastAutoTable.finalY + 8;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('B. PROGRAM AJAHAN', 20, startY);

      const programData = sisya.programSisyas.map(sp => [
        sp.programAjahan.nama,
        sp.isPasangan ? 'Termasuk Pasangan' : 'Individu',
        sp.nomorRegistrasi || '-',
        formatRupiah(sp.puniaProgram)
      ]);

      autoTable(pdf, {
        startY: startY + 2,
        theme: 'grid',
        head: [['Nama Program', 'Tipe', 'No. Registrasi', 'Punia']],
        body: programData,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [241, 245, 249], textColor: 20 },
        margin: { left: 20, right: 20 }
      });

      // Status
      startY = pdf.lastAutoTable.finalY + 8;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('C. STATUS & PEMBAYARAN', 20, startY);

      autoTable(pdf, {
        startY: startY + 4,
        theme: 'plain',
        head: [],
        body: [
          ['Status Akademik', ':', formatStatus(sisya.status)],
          ['Status Pembayaran', ':', formatStatus(sisya.statusPembayaran)],
          ['Total Tagihan Punia', ':', formatRupiah(sisya.totalPunia)],
          ['Total Terbayar', ':', formatRupiah(sisya.totalTerbayar)],
          ['Sisa Tagihan', ':', formatRupiah(sisya.totalPunia - sisya.totalTerbayar)]
        ],
        styles: { fontSize: 9, cellPadding: 1 },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold' },
          1: { cellWidth: 5 },
          2: { cellWidth: 100 }
        },
        margin: { left: 20 }
      });

      // Tanda Tangan
      startY = pdf.lastAutoTable.finalY + 20;
      if (startY > 270) {
        pdf.addPage();
        startY = 20;
      }

      pdf.setFont('helvetica', 'normal');
      pdf.text('Denpasar, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 130, startY);
      pdf.text('Pendaftar', 130, startY + 6);

      pdf.setFont('helvetica', 'bold');
      pdf.text(sisya.namaLengkap, 130, startY + 25);
      pdf.line(130, startY + 26, 180, startY + 26);

      pdf.save(`Formulir_Registrasi_${sisya.nomorPendaftaran}.pdf`);
      toast.success('Formulir registrasi berhasil diunduh');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal membuat file PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Academic status state
  const [academicStatus, setAcademicStatus] = useState('');
  const [tanggalDiksan, setTanggalDiksan] = useState('');

  useEffect(() => {
    fetchSisyaDetail();
  }, [id]);

  useEffect(() => {
    if (sisya) {
      setAcademicStatus(sisya.status);
      if (sisya.tanggalDiksan) {
        setTanggalDiksan(new Date(sisya.tanggalDiksan).toISOString().split('T')[0]);
      }
    }
  }, [sisya]);

  const handleDownload = (blobUrl, label) => {
    if (!blobUrl) return;

    const extension = blobUrl.includes('image/png') ? 'png' :
      blobUrl.includes('image/jpeg') ? 'jpg' :
        blobUrl.includes('application/pdf') ? 'pdf' : 'jpg';

    const fileName = `${label}_${sisya.namaLengkap.replace(/\s+/g, '_')}`;

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Mengunduh ${label}...`);
  };



  const fetchSisyaDetail = async () => {
    try {
      const res = await api.get(`/sisya/${id}`);
      if (res.data.success) {
        setSisya(res.data.data);
      }
    } catch (err) {
      setError('Gagal memuat detail sisya');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchPartner = async (query) => {
    setPartnerQuery(query);
    if (!query || query.length < 3) {
      setPartnerResults([]);
      return;
    }
    setIsSearchingPartner(true);
    try {
      const res = await api.get(`/sisya?search=${query}&limit=10`);
      if (res.data.success) {
        // Filter out current sisya and those not in Kawikon
        const filtered = res.data.data.filter(s => 
          s.id !== sisya.id && 
          s.programSisyas.some(p => p.programAjahan.kode === 'KAWIKON')
        );
        setPartnerResults(filtered);
      }
    } catch (error) {
      console.error('Error searching partner:', error);
    } finally {
      setIsSearchingPartner(false);
    }
  };

  const handleLinkPartner = async () => {
    if (!selectedPartner) {
      toast.error('Pilih pasangan terlebih dahulu');
      return;
    }
    setIsLinking(true);
    try {
      const res = await api.post(`/sisya/${id}/link-partner`, { partnerId: selectedPartner.id });
      if (res.data.success) {
        toast.success('Berhasil menautkan pasangan');
        setShowLinkPartnerModal(false);
        setPartnerQuery('');
        setPartnerResults([]);
        setSelectedPartner(null);
        fetchSisyaDetail();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menautkan pasangan');
    } finally {
      setIsLinking(false);
    }
  };

  const handleOpenVerifyModal = (pembayaran) => {
    setSelectedPembayaran(pembayaran);
    setNominalVerifikasi(pembayaran.nominal || '');
    setKeteranganVerifikasi(pembayaran.keterangan || '');
    setTanggalVerifikasi(pembayaran.tanggalBayar ? new Date(pembayaran.tanggalBayar).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setShowVerifyModal(true);
  };

  const handleAdminUploadBukti = async () => {
    if (!uploadFile) {
      toast.error('Pilih file bukti pembayaran');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('filePunia', uploadFile);
      formData.append('keterangan', uploadKeterangan || 'Upload oleh Admin');
      const res = await api.post(`/pembayaran/admin-upload/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Bukti pembayaran berhasil diupload');
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadKeterangan('');
        fetchSisyaDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengupload bukti');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifikasi = async (status) => {
    if (status === 'VERIFIKASI' && !nominalVerifikasi) {
      toast.error('Masukkan nominal yang diverifikasi');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await api.patch(`/pembayaran/${selectedPembayaran.id}/verifikasi`, {
        nominal: nominalVerifikasi,
        status,
        keterangan: keteranganVerifikasi,
        tanggalBayar: tanggalVerifikasi
      });

      if (res.data.success) {
        toast.success(`Pembayaran berhasil ${status === 'VERIFIKASI' ? 'diverifikasi' : 'ditolak'}`);
        setShowVerifyModal(false);
        fetchSisyaDetail(); // Refresh data
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses verifikasi');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete confirmation state
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePembayaran = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/pembayaran/${confirmDelete.id}`);
      toast.success('Bukti pembayaran dihapus');
      setConfirmDelete({ open: false, id: null });
      fetchSisyaDetail();
    } catch (err) {
      toast.error('Gagal menghapus pembayaran');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateAcademicStatus = async () => {
    setIsUpdating(true);
    try {
      const res = await api.patch(`/sisya/${id}/academic-status`, {
        status: academicStatus,
        tanggalDiksan: academicStatus === 'MEDIKSA' ? tanggalDiksan : null
      });

      if (res.data.success) {
        toast.success('Status akademik berhasil diperbarui');
        fetchSisyaDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status akademik');
    } finally {
      setIsUpdating(false);
    }
  };

  const getAcademicStatusBadgeColor = (status) => {
    switch (status) {
      case 'AKTIF': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'MEDIKSA': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'TIDAK_AKTIF': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'LUNAS': return 'bg-green-100 text-green-800 border-green-200';
      case 'BELUM_LUNAS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MENUNGGU_VERIFIKASI': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'MENUNGGU_PEMBAYARAN': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'DITOLAK': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status.replace(/_/g, ' ');
  }

  const formatRupiah = (number) => {
    if (number < 0) {
      return `Rp. (${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(Math.abs(number))})`;
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  if (isLoading) return <div className="text-center py-12 text-muted">Memuat data...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (!sisya) return <div className="text-center py-12">Data tidak ditemukan</div>;

  const sisaTagihan = sisya.totalPunia - sisya.totalTerbayar;

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/sisya">
            <Button variant="outline" className="w-10 h-10 p-0 rounded-full">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold font-heading text-primary">Detail Sisya</h2>
            <p className="text-sm text-muted">No. {sisya.nomorPendaftaran}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={handleDownloadPdfForm}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? <Loader2 className="animate-spin mr-2" size={16} /> : <FileText className="mr-2" size={16} />}
            Formulir
          </Button>
          {isSuperAdmin && sisya.status !== 'TIDAK_AKTIF' && (
            <Button
              variant="destructive"
              className="flex-1 sm:flex-none"
              onClick={() => setShowSoftDeleteConfirm(true)}
            >
              <Trash2 className="mr-2" size={16} /> Nonaktifkan
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Kolom Kiri: Profil & Ringkasan */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-16 bg-primary/5 -z-0"></div>
            <div className="relative z-10">
              <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-primary/10 shadow-md overflow-hidden p-1">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Foto Sisya" className="w-full h-full object-cover rounded-full object-top" />
                ) : (
                  <div className="bg-primary/5 w-full h-full flex items-center justify-center rounded-full">
                    <User size={40} className="text-primary/30" />
                  </div>
                )}
              </div>

              {fotoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mb-4 h-8 text-[10px] font-bold uppercase tracking-wider"
                  onClick={() => handleDownload(fotoUrl, 'Foto')}
                >
                  <Download size={14} className="mr-1" /> Download Foto
                </Button>
              )}
              <h3 className="text-xl font-bold">{sisya.namaLengkap}</h3>
              <p className="text-sm text-muted mb-4">{sisya.email}</p>

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <div className={`inline-block px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeColor(sisya.statusPembayaran)}`}>
                  {formatStatus(sisya.statusPembayaran)}
                </div>
                <div className={`inline-block px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getAcademicStatusBadgeColor(sisya.status)}`}>
                  {formatStatus(sisya.status)}
                </div>
              </div>

              {sisya.status === 'MEDIKSA' && sisya.tanggalDiksan && (
                <div className="mb-6 p-2 bg-purple-50 border border-purple-100 rounded-md">
                  <p className="text-[10px] font-bold text-purple-700 uppercase">Tanggal Pediksaan</p>
                  <p className="text-sm font-bold text-purple-900">{new Date(sisya.tanggalDiksan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}

              <div className="pt-4 border-t border-muted/10 text-left mb-6">
                <h4 className="text-xs font-bold text-muted uppercase mb-3">Update Status Akademik</h4>
                <div className="space-y-3">
                  <select
                    className="w-full text-sm border-muted/20 rounded-md bg-white p-2 outline-none focus:ring-1 focus:ring-primary"
                    value={academicStatus}
                    onChange={(e) => setAcademicStatus(e.target.value)}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="AKTIF">AKTIF</option>
                    <option value="MEDIKSA">MEDIKSA</option>
                    <option value="TIDAK_AKTIF">TIDAK_AKTIF</option>
                  </select>

                  {academicStatus === 'MEDIKSA' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted uppercase">Tanggal Diksan</label>
                      <Input
                        type="date"
                        value={tanggalDiksan}
                        onChange={(e) => setTanggalDiksan(e.target.value)}
                      />
                    </div>
                  )}

                  <Button
                    size="sm"
                    className="w-full font-bold"
                    onClick={handleUpdateAcademicStatus}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Menyimpan...' : 'Update Status'}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-muted/10 space-y-4">
                <div className="text-left">
                  <span className="text-xs text-muted block mb-1">Ringkasan Punia</span>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Tagihan</span>
                      <span className="font-bold">{formatRupiah(sisya.totalPunia)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Total Terbayar</span>
                      <span className="font-bold">{formatRupiah(sisya.totalTerbayar)}</span>
                    </div>
                    <div className={`flex justify-between text-sm p-2 rounded ${sisaTagihan > 0 ? 'bg-red-50 text-red-700 font-bold' : 'bg-green-50 text-green-700 font-bold'}`}>
                      <span>Sisa Tagihan</span>
                      <span>{formatRupiah(sisaTagihan)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
            <div className="flex justify-between items-center border-b border-muted/20 pb-2 mb-4">
              <h4 className="font-bold text-primary">Data Pribadi</h4>
              {isSuperAdmin && (
                <Button variant="ghost" size="sm" className="h-8 text-primary hover:bg-primary/10" onClick={handleOpenEditModal}>
                  <Edit2 size={14} className="mr-1" /> Edit
                </Button>
              )}
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-muted text-xs block">TTL</span>
                <span className="font-medium">{sisya.tempatLahir}, {new Date(sisya.tanggalLahir).toLocaleDateString('id-ID')}</span>
              </div>
              <div>
                <span className="text-muted text-xs block">Alamat</span>
                <span className="font-medium">{sisya.alamat}</span>
              </div>
              <div>
                <span className="text-muted text-xs block">Griya / Desa</span>
                <span className="font-medium">{sisya.namaGriya} / {sisya.namaDesa}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Riwayat & Dokumen */}
        <div className="space-y-6 md:col-span-2">

          {/* Riwayat Pembayaran */}
          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
            <div className="flex justify-between items-center border-b border-muted/20 pb-3 mb-4">
              <h4 className="font-bold text-lg text-primary flex items-center gap-2">
                <CreditCard size={20} /> Riwayat Pembayaran (Cicilan)
              </h4>
              {isSuperAdmin && (
                <Button size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={() => setShowUploadModal(true)}>
                  <Upload size={14} className="mr-1" /> Upload Bukti Bayar
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-muted border-b border-muted/10">
                    <th className="py-2">Tanggal</th>
                    <th className="py-2">Keterangan</th>
                    <th className="py-2 text-right">Nominal</th>
                    <th className="py-2 text-center">Bukti</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/5">
                  {sisya.pembayarans.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-muted">Belum ada riwayat pembayaran.</td>
                    </tr>
                  ) : (
                    sisya.pembayarans.map((p) => (
                      <tr key={p.id} className="hover:bg-bg/50">
                        <td className="py-3">{new Date(p.createdAt).toLocaleDateString('id-ID')}</td>
                        <td className="py-3 font-medium">{p.keterangan || '-'}</td>
                        <td className="py-3 text-right font-mono font-bold">
                          {p.status === 'VERIFIKASI' ? formatRupiah(p.nominal) : '-'}
                        </td>
                        <td className="py-3 text-center">
                          <ProofLink path={p.buktiPath} />
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${p.status === 'VERIFIKASI' ? 'bg-green-100 text-green-700 border-green-200' :
                              p.status === 'MENUNGGU' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                'bg-red-100 text-red-700 border-red-200'
                            }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            {p.status === 'MENUNGGU' && (
                              <>
                                <Button size="sm" className="h-7 text-xs" onClick={() => handleOpenVerifyModal(p)}>
                                  Verifikasi
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => setConfirmDelete({ open: true, id: p.id })}>
                                  <Trash2 size={14} />
                                </Button>
                              </>
                            )}
                            {isSuperAdmin && (
                              <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-blue-500 border-blue-200 hover:bg-blue-50" onClick={() => handleOpenEditPembayaranModal(p)} title="Edit Pembayaran">
                                <Edit2 size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
            <div className="flex justify-between items-center border-b border-muted/20 pb-3 mb-4">
              <h4 className="font-bold text-lg text-primary flex items-center gap-2">
                <BookOpen size={20} /> Program Ajahan Dipilih
              </h4>
              {isSuperAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-bold"
                  onClick={handleOpenEditProgramModal}
                  disabled={isLoadingPrograms}
                >
                  {isLoadingPrograms ? <Loader2 className="animate-spin mr-1" size={14} /> : <Edit2 size={14} className="mr-1" />}
                  Edit Program
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {sisya.programSisyas.map(sp => (
                <div key={sp.id} className={`p-3 border rounded-md shadow-sm ${getProgramBadgeStyle(sp.programAjahan.nama)}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold block">{sp.programAjahan.nama}</span>
                      <span className="text-xs text-muted">{sp.isPasangan ? 'Termasuk Pasangan' : 'Individu'}</span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-white/50 px-1.5 py-0.5 rounded border border-black/5">
                          {sp.nomorRegistrasi || 'No Registrasi Belum Ada'}
                        </span>
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
                            onClick={() => handleOpenEditRegModal(sp)}
                            title="Edit Nomor Sertifikat"
                          >
                            <Edit2 size={10} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold">{formatRupiah(sp.puniaProgram)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Pasangan */}
          {(sisya.programSisyas.some(p => p.programAjahan.kode === 'KAWIKON')) && (
            <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
              <div className="flex justify-between items-center border-b border-muted/20 pb-3 mb-4">
                <h4 className="font-bold text-lg text-primary flex items-center gap-2">
                  <User size={20} /> Informasi Pasangan
                </h4>
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && !sisya.partner && !sisya.partnerOf && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold"
                    onClick={() => setShowLinkPartnerModal(true)}
                  >
                    Link Pasangan
                  </Button>
                )}
              </div>
              
              {sisya.partner || sisya.partnerOf ? (
                <div className="p-4 border rounded-md shadow-sm bg-blue-50/50 border-blue-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-muted block mb-1">Pasangan yang Ditautkan:</span>
                    <span className="font-bold text-lg text-blue-900">
                      {(sisya.partner || sisya.partnerOf).namaLengkap}
                    </span>
                    <span className="text-xs text-blue-700 block mt-1">
                      ID Pendaftaran: {(sisya.partner || sisya.partnerOf).nomorPendaftaran}
                    </span>
                  </div>
                  <Link to={`/admin/sisya/${(sisya.partner || sisya.partnerOf).id}`}>
                    <Button variant="outline" size="sm" className="font-bold border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 bg-white">
                      <ExternalLink size={14} className="mr-2" /> Lihat Profil
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-4 border border-dashed border-muted rounded-md text-center text-sm text-muted bg-bg/50">
                  Belum ada pasangan yang ditautkan.
                </div>
              )}
            </div>
          )}

          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
            <h4 className="font-bold text-lg border-b border-muted/20 pb-3 mb-4 text-primary">Dokumen Identitas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="block text-xs font-bold text-muted uppercase tracking-wider">KTP / KK</span>
                {ktpUrl ? (
                  <div className="group relative border border-muted/20 rounded-lg overflow-hidden bg-bg aspect-video flex items-center justify-center">
                    <img src={ktpUrl} alt="KTP" className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a href={ktpUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm" className="font-bold">
                          <ExternalLink size={14} className="mr-1" /> Lihat
                        </Button>
                      </a>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="font-bold"
                        onClick={() => handleDownload(ktpUrl, 'KTP')}
                      >
                        <Download size={14} className="mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 border border-dashed border-muted rounded-lg flex items-center justify-center text-sm text-muted bg-bg/50">
                    KTP tidak dilampirkan
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-bold text-muted uppercase tracking-wider">Surat Rekomendasi</span>
                {rekomendasiUrl ? (
                  <div className="group relative border border-muted/20 rounded-lg overflow-hidden bg-bg aspect-video flex items-center justify-center">
                    <img src={rekomendasiUrl} alt="Surat Rekomendasi" className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a href={rekomendasiUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm" className="font-bold">
                          <ExternalLink size={14} className="mr-1" /> Lihat
                        </Button>
                      </a>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="font-bold"
                        onClick={() => handleDownload(rekomendasiUrl, 'Rekomendasi')}
                      >
                        <Download size={14} className="mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 border border-dashed border-muted rounded-lg flex items-center justify-center text-sm text-muted bg-bg/50">
                    Surat rekomendasi tidak dilampirkan
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Edit Pembayaran Modal */}
      {showEditPembayaranModal && selectedEditPembayaran && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-muted/20">
            <div className="p-6 border-b border-muted/10 flex justify-between items-center bg-primary/5">
              <h3 className="font-bold text-lg text-primary">Edit Pembayaran</h3>
              <button type="button" onClick={() => setShowEditPembayaranModal(false)} className="text-muted hover:text-text">✕</button>
            </div>
            <form onSubmit={handleEditPembayaranSubmit}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase">Nominal (Rp)</label>
                  <Input
                    type="number"
                    placeholder="Contoh: 1500000"
                    value={editNominal}
                    onChange={(e) => setEditNominal(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase">Tanggal Transfer *</label>
                  <Input
                    type="date"
                    value={editTanggalBayar}
                    onChange={(e) => setEditTanggalBayar(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase">Catatan / Keterangan</label>
                  <Input
                    placeholder="Catatan..."
                    value={editKeterangan}
                    onChange={(e) => setEditKeterangan(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditPembayaranModal(false)}
                    disabled={isUpdating}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 size={18} className="animate-spin mr-2" /> : <CheckCircle size={18} className="mr-2" />}
                    Simpan Perubahan
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-muted/20">
            <div className="p-6 border-b border-muted/10 flex justify-between items-center bg-primary/5">
              <h3 className="font-bold text-lg text-primary">Verifikasi Pembayaran</h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-muted hover:text-text">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="aspect-video border rounded-lg overflow-hidden bg-bg flex items-center justify-center">
                <ProofPreview path={selectedPembayaran.buktiPath} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase">Nominal Diterima (Rp)</label>
                <Input
                  type="number"
                  placeholder="Contoh: 1500000"
                  value={nominalVerifikasi}
                  onChange={(e) => setNominalVerifikasi(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase">Tanggal Transfer *</label>
                <Input
                  type="date"
                  value={tanggalVerifikasi}
                  onChange={(e) => setTanggalVerifikasi(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase">Catatan / Keterangan</label>
                <Input
                  placeholder="Catatan verifikasi..."
                  value={keteranganVerifikasi}
                  onChange={(e) => setKeteranganVerifikasi(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleVerifikasi('DITOLAK')}
                  disabled={isUpdating}
                >
                  <XCircle className="mr-2" size={18} /> Tolak
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleVerifikasi('VERIFIKASI')}
                  disabled={isUpdating}
                >
                  <CheckCircle className="mr-2" size={18} /> Verifikasi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sisya Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-muted/20 my-8">
            <div className="p-6 border-b border-muted/10 flex justify-between items-center bg-primary/5">
              <h3 className="font-bold text-lg text-primary">Edit Data Pribadi</h3>
              <button onClick={() => setShowEditModal(false)} className="text-muted hover:text-text">✕</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-muted uppercase">Nama Lengkap *</label>
                    <Input
                      placeholder="Nama lengkap"
                      {...register('namaLengkap')}
                    />
                    {errors.namaLengkap && <p className="text-sm text-red-500">{errors.namaLengkap.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase">Tempat Lahir *</label>
                    <Input placeholder="Tempat lahir" {...register('tempatLahir')} />
                    {errors.tempatLahir && <p className="text-sm text-red-500">{errors.tempatLahir.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase">Tanggal Lahir *</label>
                    <div className="w-full relative z-50">
                      <DatePicker
                        selected={selectedDate}
                        onChange={handleDateChange}
                        dateFormat="dd/MM/yyyy"
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={100}
                        placeholderText="DD/MM/YYYY"
                        className="flex h-10 w-full rounded-md border border-muted bg-surface px-3 py-2 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                    <input type="hidden" {...register('tanggalLahir')} />
                    {errors.tanggalLahir && <p className="text-sm text-red-500">{errors.tanggalLahir.message}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-muted uppercase">Jenis Kelamin *</label>
                    <div className="flex space-x-6 mt-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" value="LAKI_LAKI" {...register('jenisKelamin')} className="text-primary focus:ring-primary h-4 w-4" />
                        <span>Laki-Laki</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" value="PEREMPUAN" {...register('jenisKelamin')} className="text-primary focus:ring-primary h-4 w-4" />
                        <span>Perempuan</span>
                      </label>
                    </div>
                    {errors.jenisKelamin && <p className="text-sm text-red-500">{errors.jenisKelamin.message}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-muted uppercase">Alamat *</label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-muted bg-surface px-3 py-2 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="Alamat lengkap"
                      {...register('alamat')}
                    ></textarea>
                    {errors.alamat && <p className="text-sm text-red-500">{errors.alamat.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase">No HP *</label>
                    <Input
                      placeholder="08xxxxxxxxxx"
                      {...register('noHp')}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val.startsWith('+62')) {
                          val = '0' + val.slice(3);
                        } else if (val.startsWith('62')) {
                          val = '0' + val.slice(2);
                        }
                        val = val.replace(/[^\d+]/g, '');
                        e.target.value = val;
                        register('noHp').onChange(e);
                      }}
                    />
                    {errors.noHp && <p className="text-sm text-red-500">{errors.noHp.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase">Email</label>
                    <Input type="email" placeholder="Email" {...register('email')} />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase">Nama Griya *</label>
                    <Input placeholder="Nama Griya" {...register('namaGriya')} />
                    {errors.namaGriya && <p className="text-sm text-red-500">{errors.namaGriya.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase">Nama Desa *</label>
                    <Input placeholder="Nama Desa" {...register('namaDesa')} />
                    {errors.namaDesa && <p className="text-sm text-red-500">{errors.namaDesa.message}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-muted/10">
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Batal</Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Registration Number Modal */}
      {showEditRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-muted/20">
            <div className="p-6 border-b border-muted/10 flex justify-between items-center bg-primary/5">
              <h3 className="font-bold text-lg text-primary">Edit Nomor Sertifikat</h3>
              <button onClick={() => setShowEditRegModal(false)} className="text-muted hover:text-text">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase">Program: {selectedSp?.programAjahan.nama}</label>
                <Input
                  placeholder="Contoh: 001/WLK.XVIII-BD.SDM/PDPN/V/2026"
                  value={newNomorRegistrasi}
                  onChange={(e) => setNewNomorRegistrasi(e.target.value)}
                />
                <p className="text-[10px] text-muted italic">Perubahan ini hanya berlaku untuk sisya ini saja.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2">
                <Button variant="outline" onClick={() => setShowEditRegModal(false)}>Batal</Button>
                <Button onClick={handleUpdateReg} disabled={isUpdating}>
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Bukti Bayar Modal (Super Admin) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-muted/20">
            <div className="p-6 border-b border-muted/10 flex justify-between items-center bg-primary/5">
              <h3 className="font-bold text-lg text-primary">Upload Bukti Pembayaran</h3>
              <button onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadKeterangan(''); }} className="text-muted hover:text-text">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase">File Bukti Transfer *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full text-sm border border-muted/20 rounded-md p-2 file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>

              {uploadFile && (
                <div className="border border-muted/20 rounded-lg overflow-hidden bg-bg aspect-video flex items-center justify-center">
                  <img src={URL.createObjectURL(uploadFile)} alt="Preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase">Keterangan</label>
                <Input
                  placeholder="Contoh: Pembayaran tunai di kantor"
                  value={uploadKeterangan}
                  onChange={(e) => setUploadKeterangan(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2">
                <Button variant="outline" onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadKeterangan(''); }}>Batal</Button>
                <Button onClick={handleAdminUploadBukti} disabled={isUploading || !uploadFile}>
                  {isUploading ? 'Mengupload...' : 'Upload Bukti'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete.open}
        title="Hapus Bukti Pembayaran?"
        message="Data bukti pembayaran ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeletePembayaran}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
      {/* Soft Delete Confirm Modal */}
      <ConfirmDialog
        open={showSoftDeleteConfirm}
        onCancel={() => setShowSoftDeleteConfirm(false)}
        title="Nonaktifkan Sisya"
        message={`Apakah Anda yakin ingin menonaktifkan sisya ${sisya.namaLengkap}? Data sisya tidak akan dihapus permanen, namun tidak akan muncul lagi di laporan, dashboard, dan statistik.`}
        onConfirm={handleSoftDelete}
        confirmLabel={isUpdating ? "Memproses..." : "Nonaktifkan"}
        variant="danger"
        isLoading={isUpdating}
      />

      {/* Edit Program Ajahan Modal (Super Admin) */}
      {showEditProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-muted/20 my-8">
            <div className="p-6 border-b border-muted/10 flex justify-between items-center bg-primary/5">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <BookOpen size={20} /> Edit Program Ajahan
              </h3>
              <button onClick={() => setShowEditProgramModal(false)} className="text-muted hover:text-text">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted">Centang program yang ingin diikuti oleh <span className="font-bold text-text">{sisya.namaLengkap}</span>. Perubahan akan menghitung ulang total punia.</p>

              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {allPrograms.map(prog => {
                  const isSelected = isProgramSelected(prog.id);
                  const selectedProg = selectedPrograms.find(p => p.programAjahanId === prog.id);
                  const isPas = selectedProg?.isPasangan && prog.isPasanganTersedia;
                  const price = (isPas && prog.puniaPasangan) ? prog.puniaPasangan : prog.puniaNormal;

                  return (
                    <div
                      key={prog.id}
                      className={`p-4 border rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-muted/20 bg-bg/50 hover:border-muted/40'
                      }`}
                      onClick={() => toggleProgramSelection(prog.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-primary border-primary' : 'border-muted/40'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-sm">{prog.nama}</span>
                            <span className="text-sm font-mono font-semibold text-primary ml-2 flex-shrink-0">
                              {formatRupiah(price)}
                            </span>
                          </div>
                          {prog.deskripsi && (
                            <p className="text-xs text-muted mt-0.5">{prog.deskripsi}</p>
                          )}
                          {isSelected && prog.isPasanganTersedia && (
                            <label
                              className="flex items-center gap-2 mt-2 text-xs cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isPas}
                                onChange={() => toggleProgramPasangan(prog.id)}
                                className="rounded border-muted/40 text-primary focus:ring-primary h-3.5 w-3.5"
                              />
                              <span className="text-muted">
                                Termasuk Pasangan
                                {prog.puniaPasangan && (
                                  <span className="font-mono ml-1">({formatRupiah(prog.puniaPasangan)})</span>
                                )}
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-bg/80 rounded-lg p-4 border border-muted/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Program dipilih</span>
                  <span className="font-bold">{selectedPrograms.length} program</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Total Punia Sebelumnya</span>
                  <span className="font-mono">{formatRupiah(sisya.totalPunia)}</span>
                </div>
                <div className={`flex justify-between text-sm font-bold pt-1 border-t border-muted/10 ${
                  calculateNewTotalPunia() !== sisya.totalPunia ? 'text-amber-600' : 'text-text'
                }`}>
                  <span>Total Punia Baru</span>
                  <span className="font-mono">{formatRupiah(calculateNewTotalPunia())}</span>
                </div>
                {calculateNewTotalPunia() !== sisya.totalPunia && (
                  <p className="text-[10px] text-amber-600 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    Total punia akan berubah. Status pembayaran akan dihitung ulang.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEditProgramModal(false)}>Batal</Button>
                <Button
                  onClick={handleConfirmProgramEdit}
                  disabled={selectedPrograms.length === 0}
                >
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Edit Program Dialog */}
      <ConfirmDialog
        open={showConfirmProgramEdit}
        onCancel={() => setShowConfirmProgramEdit(false)}
        title="Konfirmasi Perubahan Program"
        message={`Anda akan mengubah program ajahan untuk ${sisya.namaLengkap}. Total punia akan berubah dari ${formatRupiah(sisya.totalPunia)} menjadi ${formatRupiah(calculateNewTotalPunia())}. Status pembayaran akan dihitung ulang. Lanjutkan?`}
        onConfirm={handleSaveProgramEdit}
        confirmLabel={isSavingPrograms ? 'Menyimpan...' : 'Ya, Simpan'}
        variant="warning"
        isLoading={isSavingPrograms}
      />
      {/* Link Partner Modal */}
      {showLinkPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-muted/20">
            <div className="p-6 border-b border-muted/10 flex justify-between items-center bg-primary/5">
              <h3 className="font-bold text-lg text-primary">Tautkan Pasangan (Kawikon)</h3>
              <button onClick={() => setShowLinkPartnerModal(false)} className="text-muted hover:text-text">✕</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted mb-4">Cari data Sisya yang akan ditautkan sebagai pasangan. Keduanya harus sudah terdaftar di program Kawikon.</p>
              
              <div className="flex gap-2 mb-6">
                <Input 
                  placeholder="Cari berdasarkan nama atau no pendaftaran..." 
                  value={partnerQuery}
                  onChange={(e) => handleSearchPartner(e.target.value)}
                  className="flex-1"
                />
              </div>

              {isSearchingPartner ? (
                <div className="text-center py-4 text-muted flex justify-center items-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> Mencari...
                </div>
              ) : partnerResults.length > 0 ? (
                <div className="border border-muted/20 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-bg text-muted uppercase text-xs font-bold text-left sticky top-0">
                      <tr>
                        <th className="p-3">No. Daftar</th>
                        <th className="p-3">Nama</th>
                        <th className="p-3 text-center">Pilih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/10">
                      {partnerResults.map(p => (
                        <tr key={p.id} className="hover:bg-bg/50">
                          <td className="p-3 font-mono text-xs">{p.nomorPendaftaran}</td>
                          <td className="p-3 font-semibold">{p.namaLengkap}</td>
                          <td className="p-3 text-center">
                            <input 
                              type="radio" 
                              name="partnerSelect" 
                              checked={selectedPartner?.id === p.id}
                              onChange={() => setSelectedPartner(p)}
                              className="w-4 h-4 text-primary"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : partnerQuery.length >= 3 ? (
                <div className="text-center py-4 text-muted text-sm border border-dashed rounded-lg">
                  Tidak ditemukan Sisya Kawikon yang sesuai.
                </div>
              ) : null}

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowLinkPartnerModal(false)}>Batal</Button>
                <Button 
                  onClick={handleLinkPartner}
                  disabled={!selectedPartner || isLinking}
                >
                  {isLinking ? <Loader2 className="animate-spin mr-1" size={14} /> : null}
                  Tautkan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for Proof Preview in Modal to avoid Hook Order Error
function ProofPreview({ path }) {
  const url = useFileUrl(path);
  if (!url) return <div className="text-muted animate-pulse">Memuat bukti...</div>;
  return <img src={url} alt="Bukti" className="max-w-full max-h-full object-contain" />;
}

// Helper component for Proof Link
function ProofLink({ path }) {
  const url = useFileUrl(path);
  if (!url) return <span className="text-muted">-</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center justify-center gap-1">
      <FileText size={14} /> View
    </a>
  );
}
