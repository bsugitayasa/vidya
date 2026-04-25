import React from 'react';
import { Card, CardContent } from '../../ui/card';

export default function RincianPunia({ total, items, rekeningInfo }) {
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <Card className="border-secondary overflow-hidden">
      <div className="bg-secondary text-white p-4 font-heading font-bold text-lg">
        Rincian Punia
      </div>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="p-6 text-center text-muted text-sm">
            Belum ada program yang dipilih.
          </div>
        ) : (
          <div>
            <ul className="divide-y divide-muted/20">
              {items.map((item, idx) => (
                <li key={idx} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{item.nama}</p>
                    {item.isPasangan && <p className="text-xs text-primary">+ Pasangan</p>}
                  </div>
                  <span className="font-bold text-text">{formatRupiah(item.harga)}</span>
                </li>
              ))}
            </ul>
            <div className="bg-bg p-4 flex justify-between items-center border-t border-muted/30">
              <span className="font-bold text-lg font-heading">TOTAL PUNIA</span>
              <span className="font-bold text-2xl text-primary">{formatRupiah(total)}</span>
            </div>
          </div>
        )}
        
        {total > 0 && rekeningInfo && (
          <div className="p-6 border-t border-muted/30 bg-white">
            <h4 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wider">Informasi Transfer</h4>
            <div className="bg-bg p-4 rounded-md border border-muted/20">
              <p className="font-bold text-lg">{rekeningInfo.bank}</p>
              <p className="text-2xl font-mono text-primary my-1">{rekeningInfo.nomor}</p>
              <p className="text-sm text-muted">a/n <span className="font-semibold text-text">{rekeningInfo.pemilik}</span></p>
            </div>
            <p className="text-xs text-muted mt-3 text-center">Silakan transfer sesuai nominal Total Punia di atas.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
