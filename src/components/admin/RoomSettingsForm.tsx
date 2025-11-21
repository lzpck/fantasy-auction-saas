'use client';

import { useState, useEffect } from 'react';
import { AuctionSettings, ContractRule, ContractDurationType, getContractDurationLabel } from '@/types/auction-settings';
import { updateRoomSettings } from '@/app/actions/admin-room';
import { Save, AlertCircle, Check, Trash2, Plus, Info } from 'lucide-react';

interface RoomSettingsFormProps {
  roomId: string;
  initialSettings: AuctionSettings;
}

export function RoomSettingsForm({ roomId, initialSettings }: RoomSettingsFormProps) {
  const [settings, setSettings] = useState<AuctionSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Listener para mostrar/ocultar campo de anos fixos
  useEffect(() => {
    const select = document.getElementById('newRuleDurationType') as HTMLSelectElement;
    const container = document.getElementById('fixedYearsContainer') as HTMLElement;

    if (!select || !container) return;

    const handleChange = () => {
      container.style.display = select.value === 'fixed' ? 'block' : 'none';
    };

    select.addEventListener('change', handleChange);
    return () => select.removeEventListener('change', handleChange);
  }, [settings.contractLogic.enabled]);

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

      <div className="pt-4 border-t border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="contractLogic"
            checked={settings.contractLogic.enabled}
            onChange={(e) => handleNestedChange('contractLogic', 'enabled', e.target.checked)}
            className="rounded border-white/10 bg-slate-900 text-sky-500 focus:ring-sky-500"
          />
          <label htmlFor="contractLogic" className="text-sm font-medium text-slate-300">Habilitar Lógica de Contratos</label>
        </div>

        {settings.contractLogic.enabled && (
          <div className="space-y-4 border-t border-white/10 pt-4">
            <div className="flex items-start gap-2 bg-blue-950/20 border border-blue-900/30 rounded-lg p-3">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">Como configurar as regras de contrato:</p>
                <ul className="space-y-1 text-blue-300/80">
                  <li>• <strong>Qualquer duração:</strong> O jogador pode escolher qualquer número de anos</li>
                  <li>• <strong>Mínimo de X anos:</strong> O jogador deve escolher no mínimo X anos, mas pode escolher mais</li>
                  <li>• <strong>Duração fixa:</strong> O contrato terá sempre o número de anos especificado</li>
                </ul>
              </div>
            </div>

            <h4 className="text-sm font-medium text-slate-300">Regras Configuradas</h4>
            <div className="space-y-3">
              {settings.contractLogic.rules.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4 bg-slate-950/30 rounded-lg border border-white/5">
                  Nenhuma regra configurada. Adicione uma regra abaixo.
                </div>
              ) : (
                settings.contractLogic.rules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm bg-slate-950/50 p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono">
                          ${rule.minBid} - {rule.maxBid ? `$${rule.maxBid}` : '∞'}
                        </span>
                        <span className="text-slate-600">→</span>
                        <span className="text-emerald-400 font-medium">
                          {getContractDurationLabel(rule.durationType, rule.years, rule.minYears)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {rule.durationType === 'any' && 'Jogador escolhe a duração livremente'}
                        {rule.durationType === 'min-2' && 'Jogador deve escolher no mínimo 2 anos'}
                        {rule.durationType === 'min-3' && 'Jogador deve escolher no mínimo 3 anos'}
                        {rule.durationType === 'min-4' && 'Jogador deve escolher no mínimo 4 anos'}
                        {rule.durationType === 'fixed' && `Duração automática de ${rule.years} ano${rule.years !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newRules = settings.contractLogic.rules.filter((_, i) => i !== index);
                        handleNestedChange('contractLogic', 'rules', newRules);
                      }}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded transition-colors"
                      title="Remover regra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-900 p-4 rounded-lg border border-white/10 space-y-4">
              <h5 className="text-sm font-medium text-slate-300">Adicionar Nova Regra</h5>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Valor Mínimo ($)</label>
                  <input
                    type="number"
                    id="newRuleMin"
                    min="0"
                    placeholder="Ex: 1"
                    className="w-full bg-slate-950 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Valor Máximo ($)</label>
                  <input
                    type="number"
                    id="newRuleMax"
                    min="0"
                    placeholder="Deixe vazio para ∞"
                    className="w-full bg-slate-950 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Tipo de Duração</label>
                <select
                  id="newRuleDurationType"
                  className="w-full bg-slate-950 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  defaultValue="any"
                >
                  <option value="any">Qualquer duração de contrato</option>
                  <option value="min-2">Mínimo de 2 anos</option>
                  <option value="min-3">Mínimo de 3 anos</option>
                  <option value="min-4">Mínimo de 4 anos</option>
                  <option value="fixed">Duração fixa (especificar abaixo)</option>
                </select>
              </div>

              <div className="space-y-2" id="fixedYearsContainer" style={{ display: 'none' }}>
                <label className="text-xs font-medium text-slate-400">Anos (somente para duração fixa)</label>
                <input
                  type="number"
                  id="newRuleFixedYears"
                  min="1"
                  max="10"
                  placeholder="Ex: 3"
                  className="w-full bg-slate-950 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                onClick={() => {
                  const minInput = document.getElementById('newRuleMin') as HTMLInputElement;
                  const maxInput = document.getElementById('newRuleMax') as HTMLInputElement;
                  const durationTypeSelect = document.getElementById('newRuleDurationType') as HTMLSelectElement;
                  const fixedYearsInput = document.getElementById('newRuleFixedYears') as HTMLInputElement;

                  const min = parseInt(minInput.value);
                  const max = maxInput.value ? parseInt(maxInput.value) : undefined;
                  const durationType = durationTypeSelect.value as ContractDurationType;

                  // Validação
                  if (isNaN(min) || min < 0) {
                    alert('Por favor, insira um valor mínimo válido.');
                    return;
                  }

                  if (max !== undefined && max < min) {
                    alert('O valor máximo deve ser maior ou igual ao valor mínimo.');
                    return;
                  }

                  // Verificar sobreposição de faixas
                  const hasOverlap = settings.contractLogic.rules.some(existingRule => {
                    const existingMax = existingRule.maxBid ?? Infinity;
                    const newMax = max ?? Infinity;
                    return (min <= existingMax && newMax >= existingRule.minBid);
                  });

                  if (hasOverlap) {
                    alert('Esta faixa de valores se sobrepõe a uma regra existente. Por favor, ajuste os valores.');
                    return;
                  }

                  let newRule: ContractRule;

                  if (durationType === 'fixed') {
                    const fixedYears = parseInt(fixedYearsInput.value);
                    if (isNaN(fixedYears) || fixedYears < 1) {
                      alert('Por favor, insira um número válido de anos para duração fixa.');
                      return;
                    }
                    newRule = { minBid: min, maxBid: max, durationType: 'fixed', years: fixedYears };
                  } else if (durationType === 'min-2') {
                    newRule = { minBid: min, maxBid: max, durationType: 'min-2', minYears: 2 };
                  } else if (durationType === 'min-3') {
                    newRule = { minBid: min, maxBid: max, durationType: 'min-3', minYears: 3 };
                  } else if (durationType === 'min-4') {
                    newRule = { minBid: min, maxBid: max, durationType: 'min-4', minYears: 4 };
                  } else {
                    newRule = { minBid: min, maxBid: max, durationType: 'any', minYears: 1 };
                  }

                  const newRules = [...settings.contractLogic.rules, newRule].sort((a, b) => a.minBid - b.minBid);
                  handleNestedChange('contractLogic', 'rules', newRules);

                  // Limpar formulário
                  minInput.value = '';
                  maxInput.value = '';
                  durationTypeSelect.value = 'any';
                  fixedYearsInput.value = '';
                  (document.getElementById('fixedYearsContainer') as HTMLElement).style.display = 'none';

                  // Mostrar feedback
                  setMessage({ type: 'success', text: 'Regra adicionada! Não se esqueça de salvar as alterações.' });
                  setTimeout(() => setMessage(null), 3000);
                }}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Regra
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
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
