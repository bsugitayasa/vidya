import React from 'react';
import { Checkbox } from '../../ui/checkbox';
import { Label } from '../../ui/label';
import { Card, CardContent } from '../../ui/card';

export default function ProgramAjahanPicker({ 
  programs = [], 
  selectedPrograms = [], 
  pasanganOptions = {}, 
  onChange 
}) {
  
  const handleToggleProgram = (programId) => {
    const isSelected = selectedPrograms.includes(programId);
    let newSelected = [];
    if (isSelected) {
      newSelected = selectedPrograms.filter(id => id !== programId);
    } else {
      newSelected = [...selectedPrograms, programId];
    }
    onChange(newSelected, pasanganOptions);
  };

  const handleTogglePasangan = (programId, isChecked) => {
    const newPasanganOptions = {
      ...pasanganOptions,
      [programId]: isChecked
    };
    onChange(selectedPrograms, newPasanganOptions);
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <div className="space-y-4">
      {programs.map(program => {
        const isSelected = selectedPrograms.includes(program.id);
        const isPasangan = pasanganOptions[program.id] || false;

        return (
          <Card key={program.id} className={`border-2 transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-muted'}`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id={`program-${program.id}`} 
                  checked={isSelected}
                  onChange={() => handleToggleProgram(program.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`program-${program.id}`} className="text-lg font-bold font-heading cursor-pointer">
                      {program.nama}
                    </Label>
                    <span className="font-semibold text-primary">
                      {formatRupiah(program.puniaNormal)}
                    </span>
                  </div>
                  {program.deskripsi && (
                    <p className="text-sm text-muted mt-1">{program.deskripsi}</p>
                  )}
                  
                  {isSelected && program.isPasanganTersedia && (
                    <div className="mt-4 p-3 bg-white rounded-md border border-muted/50 ml-1">
                      <p className="text-sm font-medium mb-2">Daftar bersama pasangan?</p>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 text-sm cursor-pointer">
                          <input 
                            type="radio" 
                            name={`pasangan-${program.id}`}
                            checked={!isPasangan}
                            onChange={() => handleTogglePasangan(program.id, false)}
                            className="text-primary focus:ring-primary h-4 w-4"
                          />
                          <span>Tidak</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm cursor-pointer">
                          <input 
                            type="radio" 
                            name={`pasangan-${program.id}`}
                            checked={isPasangan}
                            onChange={() => handleTogglePasangan(program.id, true)}
                            className="text-primary focus:ring-primary h-4 w-4"
                          />
                          <span>Ya (+{formatRupiah(program.puniaPasangan - program.puniaNormal)})</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
