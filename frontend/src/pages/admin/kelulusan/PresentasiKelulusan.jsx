import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/axios';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Loader2, ArrowLeft, Volume2, VolumeX, Music } from 'lucide-react';
import { toast } from 'sonner';
import useFileUrl from '../../../hooks/useFileUrl';

// Sub-component to handle protected photo URL fetching
const SisyaPhoto = ({ filePath, namaLengkap, isFullscreen }) => {
  const photoUrl = useFileUrl(filePath);
  const fallbackUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(namaLengkap) + '&background=F6AD55&color=744210&size=512';

  return (
    <div className={`shrink-0 relative ${isFullscreen ? 'scale-110' : ''} transition-transform`}>
      <div className="w-56 h-72 md:w-72 md:h-96 rounded-2xl overflow-hidden border-8 border-white shadow-[0_0_15px_rgba(116,66,16,0.2)] bg-gray-100">
        <img 
          src={photoUrl || fallbackUrl} 
          alt={namaLengkap} 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default function PresentasiKelulusan() {
  const [rawData, setRawData] = useState([]);
  const [configs, setConfigs] = useState({});
  const [activeProgramId, setActiveProgramId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const musicUrl = useFileUrl(configs.musik_kelulusan?.nilai);

  const fetchPresentasiData = async () => {
    try {
      setIsLoading(true);
      const [presRes, confRes] = await Promise.all([
        api.get('/kelulusan/presentasi'),
        api.get('/konfigurasi')
      ]);
      
      if (presRes.data.success) {
        setRawData(presRes.data.data);
      }
      if (confRes.data.success) {
        setConfigs(confRes.data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data presentasi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentasiData();
    const interval = setInterval(() => fetchPresentasiData(), 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBalineseDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const days = ['Redite', 'Soma', 'Anggara', 'Budha', 'Wraspati', 'Sukra', 'Saniscara'];
    const pancawaras = ['Umanis', 'Paing', 'Pon', 'Wage', 'Kliwon'];
    const wukus = [
      'Sinta', 'Landep', 'Ukir', 'Kulantir', 'Tolu', 'Gumbreg', 'Wariga', 'Warigadean', 'Julungwangi', 'Sungsang',
      'Dungulan', 'Kuningan', 'Langkir', 'Medangsia', 'Pujut', 'Pahang', 'Krulut', 'Merakih', 'Tambir', 'Medangkungan',
      'Matal', 'Uye', 'Menail', 'Prangbakat', 'Bala', 'Ugu', 'Wayang', 'Kelawu', 'Dukut', 'Watugunung'
    ];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Calibrate with a known date: 2026-05-06 is Budha (3), Pon (2), Tolu (4)
    const refDate = new Date('2026-05-06');
    const dateNoon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    const refNoon = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 12, 0, 0);
    const diffDays = Math.round((dateNoon.getTime() - refNoon.getTime()) / (1000 * 60 * 60 * 24));

    // Saptawara (7 days) - Budha is idx 3
    let sIdx = (diffDays + 3) % 7;
    if (sIdx < 0) sIdx += 7;
    const saptawara = days[sIdx];

    // Pancawara (5 days) - Pon is idx 2
    let pIdx = (diffDays + 2) % 5;
    if (pIdx < 0) pIdx += 5;
    const pancawara = pancawaras[pIdx];

    // Wuku (210 days cycle, 30 weeks)
    // Tolu is index 4. Start of Tolu week is 4 * 7 = 28 days into the cycle.
    // 2026-05-06 (Budha) is the 4th day of Tolu week (Redite, Soma, Anggara, Budha).
    // So 2026-05-06 is 28 + 3 = 31 days into the 210-day cycle.
    let wCycleIdx = (diffDays + 31) % 210;
    if (wCycleIdx < 0) wCycleIdx += 210;
    const wuku = wukus[Math.floor(wCycleIdx / 7)];

    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${saptawara} ${pancawara} ${wuku}, ${day} ${monthName} ${year}`;
  };

  // Unique programs from data
  const programs = useMemo(() => {
    const map = new Map();
    rawData.forEach(item => {
      if (!map.has(item.programId)) {
        map.set(item.programId, item.programNama);
      }
    });
    const result = Array.from(map.entries()).map(([id, nama]) => ({ id, nama }));
    if (result.length > 0 && activeProgramId === null) {
      setActiveProgramId(result[0].id);
    }
    return result;
  }, [rawData, activeProgramId]);

  // Filtered data based on active tab
  const filteredData = useMemo(() => {
    if (!activeProgramId) return [];
    
    const programName = programs.find(p => p.id === activeProgramId)?.nama || '';
    
    // 1. Start with the students sorted by certificate number
    const students = [...rawData]
      .filter(item => item.programId === activeProgramId)
      .sort((a, b) => {
        const numA = parseInt(a.nomorSertifikat?.split('/')[0]) || 0;
        const numB = parseInt(b.nomorSertifikat?.split('/')[0]) || 0;
        if (numA !== numB) return numA - numB;
        return (a.nomorSertifikat || '').localeCompare(b.nomorSertifikat || '');
      });

    // 2. Prepend a "Title Slide" object and Append a "Finish Slide"
    return [
      { type: 'TITLE', programNama: programName, programId: activeProgramId },
      ...students,
      { type: 'FINISH', programNama: programName, programId: activeProgramId }
    ];
  }, [rawData, activeProgramId, programs]);

  // Reset index when program changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeProgramId]);

  const handleNext = useCallback(() => {
    if (currentIndex < filteredData.length - 1) setCurrentIndex(prev => prev + 1);
  }, [currentIndex, filteredData.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Audio playback error:", err);
        toast.error("Gagal memutar musik. Pastikan file audio valid.");
      });
    }
    setIsPlaying(!isPlaying);
  };

  if (isLoading && rawData.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-primary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <h2 className="text-xl font-heading font-bold">Memuat Data Kelulusan...</h2>
      </div>
    );
  }

  if (rawData.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-muted">
        <h2 className="text-2xl font-heading font-bold mb-2">Belum Ada Sisya Hadir</h2>
        <p className="mb-6">Silakan lakukan absensi kehadiran di menu Absensi Kelulusan terlebih dahulu.</p>
        <Link to="/admin/kelulusan/absensi">
          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#744210] text-white hover:bg-[#C05621] transition-all shadow-lg font-bold">
            <ArrowLeft size={20} /> Kembali ke Absensi
          </button>
        </Link>
      </div>
    );
  }

  const currentSisya = filteredData[currentIndex];

  return (
    <div className={`relative bg-[#FFFAF0] text-[#2D3748] overflow-hidden flex flex-col ${isFullscreen ? 'fixed inset-0 z-[100]' : 'h-[85vh] rounded-2xl shadow-xl border border-[#F6AD55]/30'}`}>
      
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#C05621 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Header Organizer */}
      <div className="w-full pt-6 px-12 flex flex-col border-b-2 border-[#C05621]/20 relative z-10 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-6">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-16 md:h-20 w-auto object-contain" 
              onError={(e) => {e.target.onerror = null; e.target.src="https://ui-avatars.com/api/?name=PD&background=744210&color=fff"}} 
            />
            <div className="flex flex-col justify-center">
              <h1 className="text-xl md:text-3xl font-black font-heading tracking-wider text-[#C05621] uppercase leading-tight">Perkumpulan Dharmopadesa Pusat Nusantara</h1>
              <p className="text-[#744210] font-black tracking-[0.3em] text-sm mt-1">PROSESI KELULUSAN — <span className="text-[#C05621]">{programs.find(p => p.id === activeProgramId)?.nama || 'PROGRAM AJAHAN'}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/admin/kelulusan/absensi">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-[#744210] hover:bg-primary/10 transition-colors shadow-md border border-[#F6AD55]/50 text-xs font-bold">
                <ArrowLeft size={16} /> Kembali
              </button>
            </Link>
            <button onClick={toggleFullscreen} className="p-1.5 rounded-full bg-white text-[#744210] hover:bg-[#F6AD55] hover:text-white transition-colors shadow-md border border-[#F6AD55]/50">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>

        {/* Program Tabs */}
        <div className="flex gap-2 pb-2">
          {programs.map(prog => (
            <button
              key={prog.id}
              onClick={() => setActiveProgramId(prog.id)}
              className={`px-4 py-1 rounded-t-lg text-xs font-bold transition-all ${
                activeProgramId === prog.id 
                  ? 'bg-[#744210] text-white shadow-lg' 
                  : 'bg-white/50 text-[#744210] hover:bg-white border-x border-t border-[#C05621]/20'
              }`}
            >
              {prog.nama} ({rawData.filter(d => d.programId === prog.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Flyer */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        
        {currentSisya && currentSisya.type === 'TITLE' ? (
          // Program Title Slide
          <div className="text-center animate-in fade-in zoom-in duration-700 mb-20">
            <p className="text-[#C05621] font-black tracking-[0.5em] uppercase text-xl mb-4 opacity-70">Memasuki Prosesi Kelulusan</p>
            <h1 className="text-7xl md:text-9xl font-black font-heading text-[#744210] drop-shadow-2xl uppercase tracking-tighter">
              {currentSisya.programNama}
            </h1>
            <div className="w-32 h-2 bg-[#F6AD55] mx-auto mt-8 rounded-full shadow-lg"></div>
          </div>
        ) : currentSisya && currentSisya.type === 'FINISH' ? (
          // Program Finish Slide
          <div className="text-center animate-in fade-in zoom-in duration-700 mb-20">
            <p className="text-[#C05621] font-black tracking-[0.5em] uppercase text-xl mb-4 opacity-70">Prosesi Kelulusan Selesai</p>
            <h1 className="text-7xl md:text-9xl font-black font-heading text-[#744210] drop-shadow-2xl uppercase tracking-tighter">
              PUPUT
            </h1>
            <p className="text-[#744210] font-bold tracking-[0.2em] text-lg mt-6 opacity-80 italic">— {currentSisya.programNama} —</p>
            <div className="w-32 h-2 bg-[#F6AD55] mx-auto mt-8 rounded-full shadow-lg"></div>
          </div>
        ) : currentSisya ? (
          // Student Profile Card
          <div className="flex flex-col items-center gap-6 w-full animate-in fade-in slide-in-from-bottom-10 duration-700">
            {/* Tanggal Kelulusan Display */}
            {configs.tanggal_kelulusan && (
              <div className="bg-[#744210]/5 px-6 py-2 rounded-full border border-[#F6AD55]/30 flex items-center gap-3">
                <div className="w-2 h-2 bg-[#F6AD55] rounded-full animate-pulse"></div>
                <span className="text-[#744210] font-black tracking-widest text-lg md:text-xl">
                  {formatBalineseDate(configs.tanggal_kelulusan.nilai)}
                </span>
                <div className="w-2 h-2 bg-[#F6AD55] rounded-full animate-pulse"></div>
              </div>
            )}

            <div className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-4 border-[#F6AD55] p-12 flex flex-col md:flex-row items-center gap-16">
            <div className="absolute -top-6 -left-6 w-16 h-16 border-t-8 border-l-8 border-[#744210] rounded-tl-[40px]"></div>
            <div className="absolute -top-6 -right-6 w-16 h-16 border-t-8 border-r-8 border-[#744210] rounded-tr-[40px]"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 border-b-8 border-l-8 border-[#744210] rounded-bl-[40px]"></div>
            <div className="absolute -bottom-6 -right-6 w-16 h-16 border-b-8 border-r-8 border-[#744210] rounded-br-[40px]"></div>

            <div className="relative">
              <SisyaPhoto 
                filePath={currentSisya.fileFotoPath} 
                namaLengkap={currentSisya.namaLengkap} 
                isFullscreen={isFullscreen}
              />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#744210] text-white px-8 py-3 rounded-full font-black tracking-[0.2em] uppercase shadow-2xl border-2 border-[#F6AD55] whitespace-nowrap text-base z-20">
                {currentSisya.programNama}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-10">
              <div className="space-y-2">
                <p className="text-[#C05621] font-black tracking-[0.4em] uppercase text-sm mb-2 opacity-80">Mempersembahkan Kelulusan Kepada</p>
                <h2 className="text-4xl md:text-6xl font-black font-heading text-[#2D3748] leading-[1.1] drop-shadow-md">
                  {currentSisya.namaLengkap}
                </h2>
                <p className="text-xl md:text-3xl font-black text-[#744210] opacity-90 mt-2">
                  {currentSisya.namaGriya}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-[#FFFAF0] p-5 rounded-2xl border-l-8 border-[#F6AD55] shadow-inner">
                  <p className="text-[11px] text-[#C05621] uppercase font-black tracking-widest mb-1 opacity-70">Nomor Sertifikat</p>
                  <p className="text-2xl md:text-4xl font-mono font-black text-[#744210] tracking-tight">{currentSisya.nomorSertifikat}</p>
                </div>
              </div>
            </div>
            </div>
          </div>
        ) : (
          <div className="text-center bg-white/50 p-10 rounded-2xl border-2 border-dashed border-[#F6AD55]">
            <p className="text-[#744210] font-bold italic">Tidak ada sisya untuk program ini.</p>
          </div>
        )}
      </div>

      {/* Navigation Layer */}
      {filteredData.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border border-[#F6AD55]/30 z-20">
          <button 
            onClick={handlePrev} 
            disabled={currentIndex === 0}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#FFFAF0] text-[#744210] border border-[#C05621] hover:bg-[#C05621] hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="text-center min-w-[120px]">
            <p className="text-[9px] font-black text-[#C05621] uppercase tracking-[0.2em]">
              {currentSisya?.type === 'TITLE' ? 'Halaman Judul' : currentSisya?.type === 'FINISH' ? 'Halaman Penutup' : 'Urutan Kelulusan'}
            </p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-base font-black text-[#744210]">{currentIndex + 1}</span>
              <span className="text-muted/40 font-bold">/</span>
              <span className="text-base font-bold text-muted/60">{filteredData.length}</span>
            </div>
          </div>

          <button 
            onClick={handleNext} 
            disabled={currentIndex === filteredData.length - 1}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#FFFAF0] text-[#744210] border border-[#C05621] hover:bg-[#C05621] hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Music Player Control */}
      {configs.musik_kelulusan && musicUrl && (
        <div className="absolute bottom-6 right-6 z-[110] flex items-center gap-3">
          <audio 
            ref={audioRef} 
            src={musicUrl} 
            loop 
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {isPlaying && (
            <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#F6AD55]/30 shadow-lg animate-in slide-in-from-right-5 duration-500">
              <p className="text-[10px] font-black text-[#744210] uppercase tracking-widest flex items-center gap-2">
                <Music size={12} className="animate-bounce" /> Musik Latar Aktif
              </p>
            </div>
          )}

          <button 
            onClick={togglePlay}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 border-2 group ${
              isPlaying 
                ? 'bg-emerald-500 border-emerald-200 text-white scale-110' 
                : 'bg-white border-[#F6AD55]/30 text-[#744210] hover:scale-110'
            }`}
            title={isPlaying ? 'Pause Musik' : 'Putar Musik'}
          >
            {isPlaying ? (
              <Volume2 size={24} className="animate-pulse" />
            ) : (
              <VolumeX size={24} className="opacity-50 group-hover:opacity-100" />
            )}
          </button>
        </div>
      )}

    </div>
  );
}
