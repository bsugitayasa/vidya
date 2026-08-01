import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import Step1DataPribadi from './Step1DataPribadi';
import Step2DataAjahan from './Step2DataAjahan';
import api from '../../../lib/axios';

// Schema validasi dengan Zod
const step1Schema = z.object({
  namaLengkap: z.string().min(3, "Nama lengkap harus diisi (min 3 karakter)"),
  tempatLahir: z.string().min(2, "Tempat lahir harus diisi"),
  tanggalLahir: z.string().min(1, "Tanggal lahir harus diisi"),
  jenisKelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN'], { required_error: "Pilih jenis kelamin" }),
  alamat: z.string().min(10, "Alamat harus lengkap (min 10 karakter)"),
  noHp: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .transform(val => {
      if (val.startsWith('62')) return '0' + val.substring(2);
      return val;
    })
    .refine(val => /^08\d+$/.test(val), "Nomor HP harus diawali dengan 08")
    .refine(val => val.length >= 10, "Nomor HP minimal 10 digit"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal('')),
});

const step2Schema = z.object({
  namaGriya: z.string().min(3, "Nama Griya harus diisi"),
  namaDesa: z.string().min(3, "Nama Desa/Kecamatan harus diisi"),
});

export default function RegistrasiWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [programs, setPrograms] = useState([]);
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [pasanganOptions, setPasanganOptions] = useState({});
  const [files, setFiles] = useState({
    fileIdentitas: null,
    fileFoto: null,
    filePunia: null,
    fileRekomendasi: null
  });
  const [rekeningInfo, setRekeningInfo] = useState({ bank: 'Bank BPD Bali', nomor: '0987654321', pemilik: 'PDPN DIKJAR POLEKSOSDA' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState({ open: false, nomorPendaftaran: '', namaLengkap: '' });
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, formState: { errors }, trigger, getValues, setValue, watch } = useForm({
    resolver: zodResolver(step === 1 ? step1Schema : step2Schema),
    mode: 'onTouched',
    shouldUnregister: false,
  });

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await api.get('/program-ajahan');
        if (response.data.success) {
          setPrograms(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setIsLoadingPrograms(false);
      }
    };

    const fetchConfig = async () => {
      try {
        const response = await api.get('/konfigurasi');
        if (response.data.success) {
          const cfg = response.data.data;
          setRekeningInfo({
            bank: cfg.nama_bank?.nilai || 'Bank BPD Bali',
            nomor: cfg.nomor_rekening?.nilai || '018.02.02.31507-5',
            pemilik: cfg.nama_rekening?.nilai || 'PDPN DIKJAR POLEKSOSDA'
          });
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };

    fetchPrograms();
    fetchConfig();
  }, []);

  const nextStep = async () => {
    const isStepValid = await trigger();
    if (!isStepValid) return;

    // Cek duplikat hanya saat dari step 1 ke step 2
    if (step === 1) {
      const values = getValues();
      setIsCheckingDuplicate(true);
      try {
        const res = await api.post('/sisya/check-duplicate', {
          namaLengkap: values.namaLengkap,
          tanggalLahir: values.tanggalLahir,
          noHp: values.noHp,
        });
        if (res.data.isDuplicate) {
          setDuplicateModal({
            open: true,
            nomorPendaftaran: res.data.nomorPendaftaran,
            namaLengkap: res.data.namaLengkap
          });
          return;
        }
      } catch (err) {
        console.error('Check duplicate error:', err);
        // Jika gagal cek, lanjutkan saja (fail open)
      } finally {
        setIsCheckingDuplicate(false);
      }
    }

    setStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProgramChange = (newSelected, newPasanganOpts) => {
    setSelectedPrograms(newSelected);
    setPasanganOptions(newPasanganOpts);
  };

  const handleFileSelected = (field, file) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const onSubmit = async (data) => {
    if (selectedPrograms.length === 0) {
      setSubmitError("Silakan pilih minimal 1 Program Ajahan.");
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      const allData = getValues();
      Object.keys(allData).forEach(key => {
        if (allData[key] !== undefined && allData[key] !== null && allData[key] !== '') {
          formData.append(key, allData[key]);
        }
      });

      const programData = selectedPrograms.map(id => ({
        id,
        isPasangan: pasanganOptions[id] || false
      }));
      formData.append('programs', JSON.stringify(programData));

      if (files.fileIdentitas) formData.append('fileIdentitas', files.fileIdentitas);
      if (files.fileFoto) formData.append('fileFoto', files.fileFoto);
      if (files.filePunia) formData.append('filePunia', files.filePunia);
      if (files.fileRekomendasi) formData.append('fileRekomendasi', files.fileRekomendasi);

      const response = await api.post('/sisya/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        navigate('/daftar/sukses', {
          state: {
            nomorPendaftaran: response.data.data.nomorPendaftaran,
            namaLengkap: response.data.data.namaLengkap
          }
        });
      } else {
        setSubmitError(response.data.message || "Terjadi kesalahan saat mendaftar.");
      }

    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || "Terjadi kesalahan pada server saat mengirim data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 font-sans">

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted/30 z-0 rounded-full"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 rounded-full transition-all duration-500"
            style={{ width: step === 1 ? '50%' : '100%' }}
          ></div>

          <div className={`relative z-10 flex flex-col items-center ${step >= 1 ? 'text-primary' : 'text-muted'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-bg ${step >= 1 ? 'bg-primary text-white' : 'bg-muted text-white'}`}>
              {step > 1 ? <CheckCircle2 size={20} /> : '1'}
            </div>
            <span className="text-xs font-semibold mt-2 hidden md:block">Data Pribadi</span>
          </div>

          <div className={`relative z-10 flex flex-col items-center ${step >= 2 ? 'text-primary' : 'text-muted'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-bg ${step >= 2 ? 'bg-primary text-white' : 'bg-muted text-white'}`}>
              2
            </div>
            <span className="text-xs font-semibold mt-2 hidden md:block">Program & Dokumen</span>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardContent className="p-6 md:p-10">
          <form onSubmit={handleSubmit(onSubmit)}>

            {step === 1 && (
              <Step1DataPribadi register={register} errors={errors} setValue={setValue} watch={watch} />
            )}

            {step === 2 && (
              <Step2DataAjahan
                register={register}
                errors={{ ...errors, programs: submitError ? { message: submitError } : undefined }}
                programs={programs}
                rekeningInfo={rekeningInfo}
                selectedPrograms={selectedPrograms}
                pasanganOptions={pasanganOptions}
                onProgramChange={handleProgramChange}
                onFileSelected={handleFileSelected}
                isLoading={isLoadingPrograms}
              />
            )}

            {/* Navigation Buttons */}
            <div className="mt-10 pt-6 border-t border-muted/20 flex justify-between items-center">
              {step === 2 ? (
                <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
              ) : <div></div>}

              {step === 1 ? (
                <Button type="button" onClick={nextStep} className="ml-auto font-bold px-8" disabled={isCheckingDuplicate}>
                  {isCheckingDuplicate ? 'Memeriksa...' : 'Selanjutnya'} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="font-bold px-8 text-lg py-6 shadow-md hover:shadow-lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Mengirim Data...' : 'Selesaikan Pendaftaran'} <CheckCircle2 className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal Duplikat Pendaftaran */}
      {duplicateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-amber-200 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-amber-50 border-b border-amber-100 p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={32} className="text-amber-500" />
              </div>
              <h3 className="font-bold text-xl text-amber-900">Data Sudah Terdaftar</h3>
              <p className="text-sm text-amber-700 mt-1">Nama, tanggal lahir, dan no HP sudah pernah didaftarkan</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center space-y-1">
                <p className="text-sm text-slate-500">Atas nama:</p>
                <p className="font-bold text-lg text-slate-800">{duplicateModal.namaLengkap}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No. Registrasi Pendaftaran</p>
                <div className="flex items-center justify-center gap-3">
                  <p className="font-mono font-bold text-2xl text-primary tracking-wider">{duplicateModal.nomorPendaftaran}</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(duplicateModal.nomorPendaftaran);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1.5 rounded-md hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700"
                    title="Salin nomor pendaftaran"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center">
                Gunakan nomor di atas untuk cek status pendaftaran Anda.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDuplicateModal({ open: false, nomorPendaftaran: '', namaLengkap: '' })}
                >
                  Tutup
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => window.open('/cek-status', '_blank')}
                >
                  Cek Status
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
