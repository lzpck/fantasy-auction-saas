'use client';

import { useState, useRef } from 'react';
import { Upload, Check, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';
import { processPlayerUpload } from '@/app/actions/player-import';
import * as XLSX from 'xlsx';

interface PlayerImportProps {
  roomId: string;
}

export function PlayerImport({ roomId }: PlayerImportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
      { Nome: 'Patrick Mahomes', Posição: 'QB', Time: 'KC' },
      { Nome: 'Christian McCaffrey', Posição: 'RB', Time: 'SF' },
      { Nome: 'Justin Jefferson', Posição: 'WR', Time: 'MIN' },
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, 'modelo_importacao_jogadores.xlsx');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', files[0]);

    const result = await processPlayerUpload(roomId, formData);

    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `${result.count} jogadores importados com sucesso!` 
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setMessage({ 
        type: 'error', 
        text: 'Erro na importação:',
        details: result.errors 
      });
    }

    setIsImporting(false);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-900/50 border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Upload className="w-5 h-5" /> Importar Jogadores
        </h3>
        <button
          onClick={handleDownloadTemplate}
          className="text-xs flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
        >
          <Download className="w-3 h-3" /> Baixar Modelo
        </button>
      </div>
      
      <div className="p-4 border-2 border-dashed border-white/10 rounded-lg hover:border-sky-500/50 transition-colors bg-slate-950/50">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <FileSpreadsheet className="w-8 h-8 text-slate-500" />
          <div className="text-sm text-slate-300">
            <label htmlFor="file-upload" className="cursor-pointer text-sky-500 hover:text-sky-400 font-medium">
              Clique para selecionar
            </label>
            {' '}ou arraste o arquivo aqui
          </div>
          <p className="text-xs text-slate-500">
            Suporta .xlsx, .xls e .csv (Máx. 5MB)
          </p>
        </div>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleFileUpload}
          disabled={isImporting}
          className="hidden"
        />
      </div>

      {isImporting && (
        <div className="flex items-center justify-center gap-2 text-sm text-sky-400 animate-pulse">
          <span className="animate-spin">⏳</span> Processando arquivo...
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900' : 'bg-red-900/30 text-red-400 border border-red-900'
        }`}>
          <div className="flex items-center gap-2 font-medium mb-1">
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
          {message.details && (
            <ul className="list-disc list-inside text-xs opacity-80 space-y-1 mt-2 max-h-32 overflow-y-auto">
              {message.details.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
