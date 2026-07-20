import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Check, Camera, Users, GraduationCap, ClipboardList, Loader2, ArrowLeft, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DokumentasiUpload from '../../components/ui/DokumentasiUpload';

const STATUS_OPTIONS = [
  { value: 'HADIR', label: 'H', color: 'bg-green-500', hoverBg: 'hover:bg-green-100', activeBg: 'bg-green-100 ring-2 ring-green-500', textColor: 'text-green-700' },
  { value: 'IZIN', label: 'I', color: 'bg-blue-500', hoverBg: 'hover:bg-blue-100', activeBg: 'bg-blue-100 ring-2 ring-blue-500', textColor: 'text-blue-700' },
  { value: 'SAKIT', label: 'S', color: 'bg-yellow-500', hoverBg: 'hover:bg-yellow-100', activeBg: 'bg-yellow-100 ring-2 ring-yellow-500', textColor: 'text-yellow-700' },
  { value: 'ALPHA', label: 'A', color: 'bg-red-500', hoverBg: 'hover:bg-red-100', activeBg: 'bg-red-100 ring-2 ring-red-500', textColor: 'text-red-700' },
];

export default function InputAbsensiPublic() {
  const [step, setStep] = useState(1);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [mataKuliahs, setMataKuliahs] = useState([]);
  const [sesis, setSesis] = useState([]);
  const [selectedMk, setSelectedMk] = useState(null);

  const [sesiData, setSesiData] = useState(null);
  const [absensiState, setAbsensiState] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [confirmSetAll, setConfirmSetAll] = useState({ open: false, status: '' });

  const [isLoading, setIsLoading] = useState(true);

  // Fetch programs on mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/open/absensi/program-ajahan');
      if (res.data.success) {
        setPrograms(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      setMessage({ type: 'error', text: 'Gagal memuat program ajahan.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    if (!selectedProgram || !pin) return;

    setIsVerifying(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/open/absensi/verify-pin', {
        programId: selectedProgram.id,
        pin: pin
      });
      if (res.data.success) {
        setStep(2);
        fetchSesis(selectedProgram.id);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal memverifikasi PIN';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchSesis = async (programId) => {
    setIsLoading(true);
    try {
      // First fetch MK
      const mkRes = await api.get(`/open/absensi/program-ajahan/${programId}/mata-kuliah`);
      if (mkRes.data.success) {
        const mks = mkRes.data.data;
        setMataKuliahs(mks);

        // Then fetch sessions for each MK
        const allSesis = [];
        for (const mk of mks) {
          try {
            const sesiRes = await api.get(`/open/absensi/mata-kuliah/${mk.id}/sesi`);
            if (sesiRes.data.success && sesiRes.data.data.sesiList) {
              const sesiListWithMkInfo = sesiRes.data.data.sesiList.map(s => ({
                ...s,
                mkId: mk.id,
                mkNama: mk.nama,
                mkKode: mk.kode
              }));
              allSesis.push(...sesiListWithMkInfo);
            }
          } catch (e) {
            console.error(`Error fetching sesi for MK ${mk.id}:`, e);
          }
        }

        // Sort sessions by date (newest first)
        allSesis.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        setSesis(allSesis);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Gagal memuat daftar sesi.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSesi = async (sesiId) => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.get(`/open/absensi/sesi/${sesiId}`);
      if (res.data.success) {
        setSesiData(res.data.data);

        // Inisialisasi state absensi
        const initialState = {};
        res.data.data.daftarSisya?.forEach(sisya => {
          initialState[sisya.sisyaId] = sisya.status || null;
        });
        setAbsensiState(initialState);
        setStep(3);
      }
    } catch (error) {
      console.error('Error fetching sesi detail:', error);
      setMessage({ type: 'error', text: 'Gagal memuat detail sesi.' });
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

  const handleSaveAbsensi = async () => {
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
      const res = await api.post(`/open/absensi/sesi/${sesiData.id}/input`, { absensi });
      if (res.data.success) {
        setHasChanges(false);
        setShowSuccessModal(true);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menyimpan absensi';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDokUploadSuccess = (data) => {
    setSesiData(prev => ({ ...prev, ...data }));
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

  const handleSuccessOK = () => {
    setShowSuccessModal(false);
    setStep(2);
    // Refresh sessions to update attendance count
    if (selectedProgram) {
      fetchSesis(selectedProgram.id);
    }
  };

  const stats = sesiData ? {
    hadir: Object.values(absensiState).filter(s => s === 'HADIR').length,
    izin: Object.values(absensiState).filter(s => s === 'IZIN').length,
    sakit: Object.values(absensiState).filter(s => s === 'SAKIT').length,
    alpha: Object.values(absensiState).filter(s => s === 'ALPHA').length,
    belum: Object.values(absensiState).filter(s => s === null).length,
  } : {};

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-3xl font-black font-heading text-primary">Absensi Kelas</h1>
        <p className="text-muted text-sm max-w-lg mx-auto">Sistem pencatatan absensi kegiatan paajah-ajahan pesraman untuk Koordinator Program.</p>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-xl text-sm border font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
          {message.text}
        </div>
      )}

      {/* Step 1: Pilih Program & Verifikasi PIN */}
      {step === 1 && (
        <div className="bg-surface rounded-2xl shadow-xl border border-muted/10 p-6 md:p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black">1</span>
            Pilih Program Ajahan
          </h2>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted">
              <Loader2 className="animate-spin mb-4 text-primary" size={32} />
              <p>Memuat daftar program...</p>
            </div>
          ) : !selectedProgram ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map(program => (
                <button
                  key={program.id}
                  onClick={() => setSelectedProgram(program)}
                  className="text-left p-5 rounded-xl border-2 border-muted/20 hover:border-primary hover:bg-primary/5 transition-all group flex items-start gap-4"
                >
                  <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-text group-hover:text-primary transition-colors">{program.nama}</h3>
                    {program.deskripsi && <p className="text-sm text-muted line-clamp-2 mt-1">{program.deskripsi}</p>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-primary" size={24} />
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Program Terpilih</p>
                    <p className="font-bold text-text">{selectedProgram.nama}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedProgram(null); setPin(''); }}
                  className="text-xs font-bold text-muted hover:text-primary underline"
                >
                  Ganti
                </button>
              </div>

              <form onSubmit={handleVerifyPin} className="space-y-4 max-w-sm mx-auto">
                <div className="space-y-2 text-center">
                  <label className="font-bold text-text flex items-center justify-center gap-2">
                    <ShieldCheck size={18} className="text-amber-500" />
                    Masukkan PIN Koordinator
                  </label>
                  <p className="text-xs text-muted">PIN ini diperlukan untuk mengakses absensi {selectedProgram.nama}.</p>
                </div>

                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full text-center text-2xl tracking-[0.5em] font-bold border-2 border-muted/30 rounded-xl px-4 py-3 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  autoFocus
                />

                <Button
                  type="submit"
                  className="w-full py-4 text-base rounded-xl shadow-lg shadow-primary/25"
                  disabled={!pin || isVerifying}
                >
                  {isVerifying ? <Loader2 className="animate-spin mx-auto" /> : 'Akses Absensi'}
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Pilih Sesi */}
      {step === 2 && (
        <div className="bg-surface rounded-2xl shadow-xl border border-muted/10 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black">2</span>
              Pilih Sesi Kelas
            </h2>
            <button
              onClick={() => setStep(1)}
              className="text-sm text-muted hover:text-primary flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowLeft size={16} /> Kembali
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted">
              <Loader2 className="animate-spin mb-4 text-primary" size={32} />
              <p>Memuat daftar sesi...</p>
            </div>
          ) : sesis.length === 0 ? (
            <div className="text-center p-12 bg-muted/5 rounded-xl border border-dashed border-muted/30">
              <Calendar className="mx-auto mb-4 text-muted/50" size={48} />
              <p className="text-muted font-medium">Belum ada sesi absensi yang dibuat untuk program ini.</p>
              <p className="text-xs text-muted/70 mt-1">Silakan minta Admin untuk membuat sesi kelas terlebih dahulu.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sesis.map(sesi => (
                <button
                  key={sesi.id}
                  onClick={() => handleSelectSesi(sesi.id)}
                  className="w-full text-left p-4 rounded-xl border border-muted/20 hover:border-primary hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold leading-tight">Pert</span>
                      <span className="text-lg font-black leading-tight">{sesi.pertemuan}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-text group-hover:text-primary transition-colors line-clamp-1">{sesi.mkNama}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(sesi.tanggal).toLocaleDateString('id-ID', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </span>
                        {sesi.topik && (
                          <span className="flex items-center gap-1 line-clamp-1 max-w-[200px]">
                            <BookOpen size={12} />
                            {sesi.topik}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-16 md:ml-0">
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted">Hadir</p>
                      <p className="font-bold text-text">{sesi.totalHadir} <span className="text-muted/50 font-normal">/ {sesi.totalSisya}</span></p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted/10 flex items-center justify-center text-muted group-hover:bg-primary group-hover:text-white transition-colors">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Input Absensi */}
      {step === 3 && sesiData && (
        <div className="space-y-6">
          {/* Success Modal Overlay */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-muted/20 animate-in zoom-in-95 duration-300 flex flex-col items-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 text-green-500 flex items-center justify-center mb-6">
                  <Check size={40} className="animate-in slide-in-from-bottom-2" />
                </div>
                <h3 className="text-2xl font-black font-heading text-primary mb-2">Berhasil!</h3>
                <p className="text-muted mb-8 leading-relaxed">
                  Data absensi kelas untuk <strong>{sesiData.mataKuliah.nama}</strong> telah berhasil disimpan.
                </p>
                <Button
                  onClick={handleSuccessOK}
                  className="w-full py-6 text-lg rounded-xl shadow-lg shadow-primary/20"
                >
                  Kembali ke Daftar Sesi
                </Button>
              </div>
            </div>
          )}

          <div className="bg-surface rounded-2xl shadow-xl border border-muted/10 overflow-hidden">
            <div className="bg-primary/5 p-6 border-b border-muted/10">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-bold transition-colors"
                >
                  <ArrowLeft size={16} /> Pilih Sesi Lain
                </button>
              </div>

              <h2 className="text-2xl font-bold font-heading text-primary">{sesiData.mataKuliah.nama}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-text">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Calendar size={16} /></div>
                  <div>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Tanggal & Pertemuan</p>
                    <p className="font-medium">
                      Pertemuan {sesiData.pertemuan} &bull; {new Date(sesiData.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                {sesiData.topik && (
                  <div className="flex items-center gap-2 text-sm text-text">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600"><BookOpen size={16} /></div>
                    <div>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Topik</p>
                      <p className="font-medium line-clamp-1" title={sesiData.topik}>{sesiData.topik}</p>
                    </div>
                  </div>
                )}
                {sesiData.narawakya && (
                  <div className="flex items-center gap-2 text-sm text-text">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><GraduationCap size={16} /></div>
                    <div>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Narawakya</p>
                      <p className="font-medium line-clamp-1">{sesiData.narawakya}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Stats Bar */}
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-xs font-bold text-green-700">Hadir: {stats.hadir}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-blue-700">Izin: {stats.izin}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span className="text-xs font-bold text-yellow-700">Sakit: {stats.sakit}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-xs font-bold text-red-700">Alpha: {stats.alpha}</span>
                </div>
                {stats.belum > 0 && (
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                    <span className="text-xs font-bold text-gray-500">Belum: {stats.belum}</span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 mb-4 bg-muted/5 p-3 rounded-xl border border-muted/10">
                <span className="text-xs font-bold text-muted uppercase tracking-wider mr-2">Set Semua:</span>
                {STATUS_OPTIONS?.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setConfirmSetAll({ open: true, status: opt.value })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm transition-transform hover:scale-105 active:scale-95 ${opt.hoverBg} ${opt.textColor} border-current/20 bg-white`}
                  >
                    {opt.label} - {opt.value}
                  </button>
                ))}
              </div>

              <ConfirmDialog
                open={confirmSetAll.open}
                title={`Set Semua ${confirmSetAll.status}?`}
                message={`Status kehadiran seluruh sisya pada sesi ini akan diubah menjadi "${confirmSetAll.status}". Anda harus menyimpan absensi agar perubahan tersimpan permanen.`}
                confirmLabel="Ya, Ubah Semua"
                variant="warning"
                onConfirm={() => {
                  setAllStatus(confirmSetAll.status);
                  setConfirmSetAll({ open: false, status: '' });
                }}
                onCancel={() => setConfirmSetAll({ open: false, status: '' })}
              />

              {/* Table / List */}
              <div className="border border-muted/20 rounded-xl overflow-hidden bg-white">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/5 border-b border-muted/20">
                        <th className="p-4 font-bold text-xs text-muted uppercase tracking-wider text-center w-12">No</th>
                        <th className="p-4 font-bold text-xs text-muted uppercase tracking-wider">Nama Sisya</th>
                        <th className="p-4 font-bold text-xs text-muted uppercase tracking-wider">Griya</th>
                        <th className="p-4 font-bold text-xs text-muted uppercase tracking-wider text-center">Status Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/10">
                      {!sesiData?.daftarSisya || sesiData.daftarSisya.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-muted">Tidak ada sisya.</td>
                        </tr>
                      ) : (
                        sesiData.daftarSisya.map((sisya, index) => (
                          <tr key={sisya.sisyaId} className="hover:bg-primary/5 transition-colors">
                            <td className="p-4 text-sm text-center text-muted">{index + 1}</td>
                            <td className="p-4 text-sm font-bold text-text">{sisya.namaLengkap}</td>
                            <td className="p-4 text-sm text-muted">{sisya.namaGriya}</td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                {STATUS_OPTIONS?.map(opt => {
                                  const isActive = absensiState[sisya.sisyaId] === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      onClick={() => handleStatusChange(sisya.sisyaId, opt.value)}
                                      className={`w-10 h-10 rounded-xl text-sm font-black transition-all shadow-sm ${isActive
                                        ? `${opt.activeBg} ${opt.textColor} scale-110 shadow-md`
                                        : `bg-white text-gray-400 hover:bg-gray-50 border border-gray-200 hover:border-gray-300`
                                        }`}
                                      title={opt.value}
                                    >
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

                {/* Mobile View List */}
                <div className="md:hidden divide-y divide-muted/10">
                  {!sesiData?.daftarSisya || sesiData.daftarSisya.length === 0 ? (
                    <div className="p-8 text-center text-muted">Tidak ada sisya.</div>
                  ) : (
                    sesiData.daftarSisya.map((sisya, index) => (
                      <div key={sisya.sisyaId} className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded bg-muted/10 text-muted text-xs font-bold flex items-center justify-center shrink-0">{index + 1}</span>
                          <div>
                            <p className="font-bold text-sm text-text leading-tight mb-1">{sisya.namaLengkap}</p>
                            <p className="text-xs text-muted flex items-center gap-1"><MapPin size={10} /> {sisya.namaGriya}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-between pl-9">
                          {STATUS_OPTIONS?.map(opt => {
                            const isActive = absensiState[sisya.sisyaId] === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => handleStatusChange(sisya.sisyaId, opt.value)}
                                className={`flex-1 max-w-[3rem] h-10 rounded-xl text-sm font-black transition-all shadow-sm ${isActive
                                  ? `${opt.activeBg} ${opt.textColor} scale-105 shadow-md`
                                  : `bg-white text-gray-400 hover:bg-gray-50 border border-gray-200`
                                  }`}
                                title={opt.value}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Upload Dokumentasi */}
          <div className="bg-surface rounded-2xl shadow-xl border border-muted/10 p-6">
            <h3 className="text-lg font-bold font-heading text-text flex items-center gap-2 mb-6 border-b border-muted/10 pb-4">
              <Camera size={20} className="text-primary" />
              Unggah Dokumentasi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DokumentasiUpload
                label="Dokumentasi Sisya"
                icon={Users}
                fieldName="dokSisya"
                existingPath={sesiData.dokSisyaPath}
                sesiId={sesiData.id}
                onUploadSuccess={handleDokUploadSuccess}
                onDeleteSuccess={handleDokDeleteSuccess}
                isSuperAdmin={false}
                uploadEndpoint={`/open/absensi/sesi/${sesiData.id}/upload-dokumentasi`}
                previewEndpointBase="/open/absensi/files"
              />
              <DokumentasiUpload
                label="Dokumentasi Narawakya"
                icon={GraduationCap}
                fieldName="dokNarawak"
                existingPath={sesiData.dokNarawakPath}
                sesiId={sesiData.id}
                onUploadSuccess={handleDokUploadSuccess}
                onDeleteSuccess={handleDokDeleteSuccess}
                isSuperAdmin={false}
                uploadEndpoint={`/open/absensi/sesi/${sesiData.id}/upload-dokumentasi`}
                previewEndpointBase="/open/absensi/files"
              />
              <DokumentasiUpload
                label="Dokumentasi Panitia"
                icon={ClipboardList}
                fieldName="dokPanitia"
                existingPath={sesiData.dokPanitiaPath}
                sesiId={sesiData.id}
                onUploadSuccess={handleDokUploadSuccess}
                onDeleteSuccess={handleDokDeleteSuccess}
                isSuperAdmin={false}
                uploadEndpoint={`/open/absensi/sesi/${sesiData.id}/upload-dokumentasi`}
                previewEndpointBase="/open/absensi/files"
              />
            </div>
          </div>

          <div className="h-24"></div> {/* Spacer for fixed button */}

          {/* Fixed Save Button Container */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-muted/20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-40">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="hidden sm:block text-sm font-medium text-muted">
                {hasChanges ? <span className="text-amber-600 font-bold">Ada perubahan yang belum disimpan!</span> : 'Semua absensi telah disimpan.'}
              </div>
              <Button
                onClick={handleSaveAbsensi}
                disabled={isSaving || !hasChanges}
                className="w-full sm:w-auto flex-1 sm:flex-none shadow-xl shadow-primary/20 rounded-xl py-6 sm:py-2 text-base font-bold flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {isSaving ? 'Menyimpan...' : 'Simpan Absensi Kelas'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
