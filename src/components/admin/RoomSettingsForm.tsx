'use client';

import { useState } from 'react';
import { AuctionSettings } from '@/types/auction-settings';
import { updateRoomSettings } from '@/app/actions/admin-room';
import { Save, AlertCircle, Check } from 'lucide-react';

interface RoomSettingsFormProps {
  roomId: string;
  initialSettings: AuctionSettings;
}

export function RoomSettingsForm({ roomId, initialSettings }: RoomSettingsFormProps) {
  const [settings, setSettings] = useState<AuctionSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (field: keyof AuctionSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: keyof AuctionSettings, field: string, value: any) => {
    setSettings(prev => {
      const parentValue = prev[parent];
      if (typeof parentValue === 'object' && parentValue !== null) {
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [field]: value
          }
        };
      }
      return prev;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    const result = await updateRoomSettings(roomId, settings);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao salvar configurações.' });
    }
    
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-slate-900/50 border-white/10">
      <h3 className="text-lg font-semibold text-white">Configurações da Sala</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Budget Inicial ($)</label>
          <input
            type="number"
            value={settings.startingBudget}
            onChange={(e) => handleChange('startingBudget', Number(e.target.value))}
            className="w-full bg-slate-900 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Incremento Mínimo ($)</label>
          <input
            type="number"
            value={settings.minIncrement}
            onChange={(e) => handleChange('minIncrement', Number(e.target.value))}
            className="w-full bg-slate-900 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Tempo do Timer (horas)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={settings.timerSeconds / 3600}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0) {
                handleChange('timerSeconds', val * 3600);
              }
            }}
            className="w-full bg-slate-900 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <p className="text-xs text-slate-500">
            Equivale a {settings.timerSeconds} segundos.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Tamanho do Roster</label>
          <input
            type="number"
            value={settings.roster.maxRosterSize}
            onChange={(e) => handleNestedChange('roster', 'maxRosterSize', Number(e.target.value))}
            className="w-full bg-slate-900 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <input
               type="checkbox"
               id="contractLogic"
               checked={settings.contractLogic.enabled}
               onChange={(e) => handleNestedChange('contractLogic', 'enabled', e.target.checked)}
               className="rounded border-white/10 bg-slate-900 text-sky-500 focus:ring-sky-500"
             />
             <label htmlFor="contractLogic" className="text-sm text-slate-300">Habilitar Lógica de Contratos</label>
           </div>

           {settings.contractLogic.enabled && (
             <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
               <h4 className="text-sm font-medium text-slate-300">Regras de Contrato</h4>
               <div className="space-y-2">
                 {settings.contractLogic.rules.map((rule, index) => (
                   <div key={index} className="flex items-center gap-2 text-sm text-slate-400 bg-slate-950/50 p-2 rounded border border-white/5">
                     <span>${rule.minBid} - {rule.maxBid ? `$${rule.maxBid}` : '∞'}</span>
                     <span className="text-slate-600">→</span>
                     <span className="text-slate-200">{rule.years} ano{rule.years > 1 ? 's' : ''}</span>
                     <button
                       onClick={() => {
                         const newRules = settings.contractLogic.rules.filter((_, i) => i !== index);
                         handleNestedChange('contractLogic', 'rules', newRules);
                       }}
                       className="ml-auto text-red-400 hover:text-red-300"
                     >
                       Remover
                     </button>
                   </div>
                 ))}
               </div>
               
               <div className="flex gap-2 items-end bg-slate-900 p-3 rounded border border-white/10">
                 <div className="space-y-1">
                   <label className="text-xs text-slate-500">Min ($)</label>
                   <input
                     type="number"
                     id="newRuleMin"
                     className="w-20 bg-slate-950 border border-white/10 rounded px-2 py-1 text-sm text-white"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs text-slate-500">Max ($)</label>
                   <input
                     type="number"
                     id="newRuleMax"
                     placeholder="∞"
                     className="w-20 bg-slate-950 border border-white/10 rounded px-2 py-1 text-sm text-white"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs text-slate-500">Anos</label>
                   <input
                     type="number"
                     id="newRuleYears"
                     className="w-16 bg-slate-950 border border-white/10 rounded px-2 py-1 text-sm text-white"
                   />
                 </div>
                 <button
                   onClick={() => {
                     const minInput = document.getElementById('newRuleMin') as HTMLInputElement;
                     const maxInput = document.getElementById('newRuleMax') as HTMLInputElement;
                     const yearsInput = document.getElementById('newRuleYears') as HTMLInputElement;
                     
                     const min = parseInt(minInput.value);
                     const max = maxInput.value ? parseInt(maxInput.value) : null;
                     const years = parseInt(yearsInput.value);
                     
                     if (!isNaN(min) && !isNaN(years)) {
                       const newRule = { minBid: min, maxBid: max, years };
                       const newRules = [...settings.contractLogic.rules, newRule].sort((a, b) => a.minBid - b.minBid);
                       handleNestedChange('contractLogic', 'rules', newRules as any);
                       
                       minInput.value = '';
                       maxInput.value = '';
                       yearsInput.value = '';
                     }
                   }}
                   className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded h-[30px]"
                 >
                   Adicionar
                 </button>
               </div>
             </div>
           )}
           
           <button
             onClick={handleSave}
             disabled={isSaving}
             className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
           >
             {isSaving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
             Salvar Alterações
           </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900' : 'bg-red-900/30 text-red-400 border border-red-900'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}
    </div>
  );
}
