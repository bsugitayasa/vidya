import React from 'react';
import RegistrasiWizard from '../../components/forms/registrasi/RegistrasiWizard';

export default function Registrasi() {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-heading text-primary">Pendaftaran Sisya Baru</h2>
        <p className="text-muted mt-2">Silakan lengkapi form pendaftaran di bawah ini untuk bergabung dengan program ajahan kami.</p>
      </div>
      <RegistrasiWizard />
    </div>
  );
}
