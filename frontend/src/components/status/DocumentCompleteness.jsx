import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  FileWarning,
  IdCard,
  Image as ImageIcon,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import usePublicSisyaDocument from '../../hooks/usePublicSisyaDocument';

function DocumentCard({ title, description, available, preview, icon: Icon }) {
  const isPdf = preview.mimeType.includes('pdf');

  return (
    <article className={`overflow-hidden rounded-xl border transition-colors ${available ? 'border-emerald-200 bg-white' : 'border-dashed border-amber-300 bg-amber-50/40'}`}>
      <div className="relative aspect-[4/3] min-h-36 bg-slate-50">
        {!available ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center text-amber-700">
            <FileWarning size={32} strokeWidth={1.7} />
            <span className="mt-2 text-xs font-semibold">Berkas belum dilengkapi</span>
          </div>
        ) : preview.loading ? (
          <div className="flex h-full items-center justify-center text-primary">
            <Loader2 className="animate-spin" size={26} />
          </div>
        ) : preview.url && isPdf ? (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-red-50 to-slate-100 px-4 text-center text-red-700">
            <span className="flex h-14 w-12 items-center justify-center rounded-lg border border-red-200 bg-white shadow-sm">
              <FileText size={27} />
            </span>
            <span className="mt-2 text-xs font-bold">Dokumen PDF</span>
            <span className="mt-0.5 text-[10px] text-muted">Klik untuk membuka berkas</span>
          </div>
        ) : preview.url ? (
          <img src={preview.url} alt={`Pratinjau ${title}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center text-muted">
            <Icon size={32} strokeWidth={1.7} />
            <span className="mt-2 text-xs">Pratinjau tidak tersedia</span>
          </div>
        )}

        {available && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
            <CheckCircle2 size={12} /> Lengkap
          </span>
        )}
        {preview.url && isPdf && (
          <span className="absolute right-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">PDF</span>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start gap-2">
          <Icon size={17} className={available ? 'mt-0.5 shrink-0 text-emerald-600' : 'mt-0.5 shrink-0 text-amber-600'} />
          <div className="min-w-0">
            <h5 className="text-sm font-bold text-text">{title}</h5>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{description}</p>
          </div>
        </div>
        {preview.url && (
          <a
            href={preview.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Lihat berkas <ExternalLink size={12} />
          </a>
        )}
      </div>
    </article>
  );
}

export default function DocumentCompleteness({ sisya }) {
  const documents = [
    { jenis: 'foto', title: 'Foto', description: 'Foto diri terbaru', path: sisya.fileFotoPath, icon: ImageIcon },
    { jenis: 'identitas', title: 'KTP', description: 'Identitas yang terdaftar', path: sisya.fileIdentitasPath, icon: IdCard },
    { jenis: 'rekomendasi', title: 'Surat Rekomendasi', description: 'Surat rekomendasi resmi', path: sisya.fileRekomendasiPath, icon: FileCheck2 }
  ];
  const fotoPreview = usePublicSisyaDocument(sisya.nomorPendaftaran, 'foto', Boolean(sisya.fileFotoPath));
  const identitasPreview = usePublicSisyaDocument(sisya.nomorPendaftaran, 'identitas', Boolean(sisya.fileIdentitasPath));
  const rekomendasiPreview = usePublicSisyaDocument(sisya.nomorPendaftaran, 'rekomendasi', Boolean(sisya.fileRekomendasiPath));
  const previews = { foto: fotoPreview, identitas: identitasPreview, rekomendasi: rekomendasiPreview };
  const completeCount = documents.filter((document) => document.path).length;
  const isComplete = completeCount === documents.length;

  return (
    <section className="mt-7 border-t pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
            <ShieldCheck size={18} className="text-primary" /> Kelengkapan Berkas
          </h4>
          <p className="mt-1 text-xs text-muted">Pastikan ketiga dokumen Anda sudah tercatat.</p>
        </div>
        <div className="sm:text-right">
          <p className={`text-sm font-bold ${isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
            {completeCount} dari 3 berkas lengkap
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 sm:w-32">
            <div
              className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${(completeCount / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {documents.map((document) => (
          <DocumentCard
            key={document.jenis}
            title={document.title}
            description={document.description}
            icon={document.icon}
            available={Boolean(document.path)}
            preview={previews[document.jenis]}
          />
        ))}
      </div>

      {!isComplete && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-amber-800">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed">Ada berkas yang belum lengkap. Silakan unggah agar proses administrasi tidak terhambat.</p>
          </div>
          <Link
            to="/lengkapi-berkas"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-amber-300 bg-white px-4 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
          >
            Lengkapi Berkas
          </Link>
        </div>
      )}
    </section>
  );
}
