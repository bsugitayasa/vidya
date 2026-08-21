import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Eye, Filter, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, XCircle, Info, ArrowUpDown, ArrowUp, ArrowDown, FileDown, Printer, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getProgramBadgeStyle } from '../../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawOrganizationHeader, generateAttendancePdf } from '../../lib/attendancePdf';

export default function SisyaList() {
  const [searchParams] = useSearchParams();
  const [sisyas, setSisyas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [programs, setPrograms] = useState([]);
  const [filterStatus, setFilterStatus] = useState(() => searchParams.get('status') || '');
  const [filterProgram, setFilterProgram] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [sort, setSort] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [filterGriya, setFilterGriya] = useState('');
  const [filterDesa, setFilterDesa] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState({ griya: [], desa: [] });
  const [isPrintingAttendance, setIsPrintingAttendance] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  useEffect(() => {
    fetchSisyas();
  }, [pagination.page, filterStatus, filterProgram, searchTerm, sort, showInactive, filterGriya, filterDesa]);

  const fetchLocationSuggestions = async () => {
    try {
      const res = await api.get('/sisya/locations/suggestions');
      if (res.data.success) {
        setLocationSuggestions(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchLocationSuggestions();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/program-ajahan');
      if (res.data.success) {
        setPrograms(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchSisyas = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: filterStatus,
        programId: filterProgram,
        search: searchTerm,
        griya: filterGriya,
        desa: filterDesa,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        ...(showInactive && { showInactive: 'true' })
      });

      const res = await api.get(`/sisya?${params.toString()}`);
      if (res.data.success) {
        setSisyas(res.data.data);
        setPagination(prev => ({
          ...prev,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching sisya:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'LUNAS': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      'BELUM_LUNAS': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Info },
      'MENUNGGU_VERIFIKASI': { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
      'MENUNGGU_PEMBAYARAN': { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: AlertCircle },
      'DITOLAK': { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
    };

    const { color, icon: Icon } = config[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Info };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${color}`}>
        <Icon size={12} />
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const getAcademicStatusBadge = (status) => {
    const config = {
      'AKTIF': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      'MEDIKSA': { color: 'bg-purple-100 text-purple-700 border-purple-200' },
      'PENDING': { color: 'bg-slate-100 text-slate-600 border-slate-200' },
      'TIDAK_AKTIF': { color: 'bg-rose-100 text-rose-700 border-rose-200' },
    };

    const { color } = config[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200' };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase shadow-sm ${color}`}>
        {status}
      </span>
    );
  };

  const handleSort = (field) => {
    setSort(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getSortIcon = (field) => {
    if (sort.sortBy !== field) return <ArrowUpDown size={14} className="text-muted/50" />;
    return sort.sortOrder === 'asc' ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />;
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

  const handleDownloadTemplate = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      let logoBase64 = null;
      try {
        logoBase64 = await getBase64ImageFromUrl('/logo.png');
      } catch (err) { }

      drawOrganizationHeader(pdf, logoBase64);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('FORMULIR REGISTRASI SISYA', 105, 45, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text('No. Pendaftaran: .........(Dikosongkan).........', 105, 51, { align: 'center' });

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
          ['Nama Lengkap', ':', '....................................................................................................'],
          ['Tempat, Tanggal Lahir', ':', '................................................... , ..................................................'],
          ['Jenis Kelamin', ':', 'Laki-Laki  /  Perempuan'],
          ['Alamat', ':', '....................................................................................................'],
          ['Nomor HP', ':', '....................................................................................................'],
          ['Email', ':', '....................................................................................................'],
          ['Nama Griya', ':', '....................................................................................................'],
          ['Nama Desa', ':', '....................................................................................................']
        ],
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold' },
          1: { cellWidth: 5 },
          2: { cellWidth: 120 }
        },
        margin: { left: 20 }
      });

      // Program Ajahan
      startY = pdf.lastAutoTable.finalY + 8;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('B. PROGRAM AJAHAN', 20, startY);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Beri tanda (X) atau centang pada program yang ingin diikuti:', 20, startY + 6);

      let currentY = startY + 13;
      const drawCheckbox = (x, y, label) => {
        pdf.rect(x, y - 3, 4, 4);
        pdf.text(label, x + 7, y);
      };

      if (programs && programs.length > 0) {
        programs.forEach((prog, idx) => {
          drawCheckbox(25, currentY, `${prog.nama} (Individu)`);
          if (prog.isPasanganTersedia) {
            drawCheckbox(105, currentY, `${prog.nama} (+Pasangan)`);
          }
          currentY += 7;
        });
      } else {
        pdf.text('(Daftar program belum tersedia, silakan tulis manual di bawah)', 20, currentY);
        currentY += 8;
        pdf.text('.......................................................................................................................', 20, currentY);
      }

      // Tanda Tangan
      startY = currentY + 20;
      if (startY > 270) {
        pdf.addPage();
        startY = 20;
      }

      pdf.setFont('helvetica', 'normal');
      pdf.text('Denpasar, ........................................... 20....', 120, startY);
      pdf.text('Pendaftar', 120, startY + 6);

      pdf.text('(..............................................................)', 115, startY + 25);

      pdf.save('Template_Formulir_Registrasi.pdf');
    } catch (error) {
      console.error('Error generating PDF template:', error);
    }
  };

  const handlePrintAttendance = async () => {
    setIsPrintingAttendance(true);

    try {
      const [response, logoBase64] = await Promise.all([
        api.get('/sisya/export/absensi'),
        getBase64ImageFromUrl('/logo.png')
      ]);
      const attendanceSisyas = response.data.data || [];
      const pdf = generateAttendancePdf(attendanceSisyas, logoBase64);

      pdf.save(`Daftar_Absensi_Sisya_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating attendance PDF:', error);
    } finally {
      setIsPrintingAttendance(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-primary">Data Sisya</h2>
          <p className="text-sm text-muted mt-1">Kelola data pendaftar dan status verifikasi</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintAttendance} disabled={isPrintingAttendance}>
            {isPrintingAttendance ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Printer size={16} className="mr-2" />}
            {isPrintingAttendance ? 'Membuat PDF...' : 'Print Absensi'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <FileDown size={16} className="mr-2" />
            Download Template
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0 justify-end">
        <label className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition">
          <input
            type="checkbox"
            className="rounded text-primary focus:ring-primary w-4 h-4"
            checked={showInactive}
            onChange={(e) => {
              setShowInactive(e.target.checked);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
          Tampilkan Nonaktif
        </label>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <Input
            placeholder="Cari nama atau nomor..."
            className="pl-10 w-full md:w-64"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
        </div>

        <Input
          placeholder="Filter Griya"
          list="griya-suggestions"
          className="w-full sm:w-40"
          value={filterGriya}
          onChange={(e) => {
            setFilterGriya(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        />
        <datalist id="griya-suggestions">
          {locationSuggestions.griya.map((g, idx) => (
            <option key={idx} value={g} />
          ))}
        </datalist>

        <Input
          placeholder="Filter Desa"
          list="desa-suggestions"
          className="w-full sm:w-40"
          value={filterDesa}
          onChange={(e) => {
            setFilterDesa(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        />
        <datalist id="desa-suggestions">
          {locationSuggestions.desa.map((d, idx) => (
            <option key={idx} value={d} />
          ))}
        </datalist>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          <option value="">Semua Status</option>
          <option value="OUTSTANDING">Belum Lunas (Semua)</option>
          <option value="MENUNGGU_PEMBAYARAN">Menunggu Pembayaran</option>
          <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
          <option value="BELUM_LUNAS">Belum Lunas (Cicilan)</option>
          <option value="LUNAS">Lunas</option>
          <option value="DITOLAK">Ditolak</option>
        </select>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          value={filterProgram}
          onChange={(e) => {
            setFilterProgram(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          <option value="">Semua Program</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.nama}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/5 border-b border-muted/20">
                <th
                  className="p-4 font-semibold text-sm text-text cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort('nomorPendaftaran')}
                >
                  <div className="flex items-center gap-1">
                    No. Pendaftaran {getSortIcon('nomorPendaftaran')}
                  </div>
                </th>
                <th
                  className="p-4 font-semibold text-sm text-text cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort('namaLengkap')}
                >
                  <div className="flex items-center gap-1">
                    Nama Lengkap {getSortIcon('namaLengkap')}
                  </div>
                </th>
                <th className="p-4 font-semibold text-sm text-text">Program</th>
                <th
                  className="p-4 font-semibold text-sm text-text cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Tgl Daftar {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="p-4 font-semibold text-sm text-text">Status</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted">Memuat data...</td>
                </tr>
              ) : sisyas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted">Belum ada data pendaftar.</td>
                </tr>
              ) : (
                sisyas.map(sisya => (
                  <tr key={sisya.id} className={`transition-colors ${sisya.status === 'TIDAK_AKTIF' ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-bg/50'}`}>
                    <td className="p-4 text-sm font-mono font-medium text-primary">{sisya.nomorPendaftaran}</td>
                    <td className="p-4 text-sm font-medium">
                      <div className="flex flex-col">
                        <span>{sisya.namaLengkap}</span>
                        <span className="text-[10px] text-primary/70 font-bold uppercase tracking-tight">{sisya.namaGriya}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex flex-col gap-1">
                        {sisya.programSisyas.map(sp => (
                          <span key={sp.id} className={`inline-block px-2 py-1 text-[10px] font-bold rounded-md border w-max shadow-sm ${getProgramBadgeStyle(sp.programAjahan.nama)}`}>
                            {sp.programAjahan.nama} {sp.isPasangan && '(+Pasangan)'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted">
                      {new Date(sisya.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex flex-col gap-1.5">
                        {getStatusBadge(sisya.statusPembayaran)}
                        {getAcademicStatusBadge(sisya.status)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Link to={`/admin/sisya/${sisya.id}`}>
                        <Button variant="ghost" className="h-9 w-9 p-0 rounded-full text-muted hover:text-primary hover:bg-primary/10 transition-all active:scale-95">
                          <Eye size={20} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-muted/20 flex items-center justify-between">
            <p className="text-sm text-muted">
              Menampilkan {sisyas.length} dari {pagination.total} data
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center space-x-1">
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Only show current page, first, last, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  } else if (
                    (pageNum === 2 && pagination.page > 3) ||
                    (pageNum === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
                  ) {
                    return <span key={pageNum} className="px-1 text-muted">...</span>;
                  }
                  return null;
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
