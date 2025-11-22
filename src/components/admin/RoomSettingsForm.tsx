'use client';

import { useState } from 'react';
import { AuctionSettings, ContractRule, ContractDurationType, getContractDurationLabel } from '@/types/auction-settings';
import { updateRoomSettings, deleteRoom } from '@/app/actions/admin-room';
import { Save, AlertCircle, Check, Trash2, Plus, Info, DollarSign, Clock, Users, Calendar, Gavel, ShieldAlert } from 'lucide-react';
import { parseFromMillions, toMillionsInput, formatToMillions } from '@/lib/format-millions';

interface RoomSettingsFormProps {
  roomId: string;
  initialSettings: AuctionSettings;
}

export function RoomSettingsForm({ roomId, initialSettings }: RoomSettingsFormProps) {
  const [settings, setSettings] = useState<AuctionSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for new rule form
  const [newRule, setNewRule] = useState<{
    min: string;
    max: string;
    durationType: ContractDurationType;
    fixedYears: string;
  }>({
    min: '',
    max: '',
    durationType: 'any',
    fixedYears: ''
  });

  const handleDeleteRoom = async () => {
    setIsDeleting(true);
    const result = await deleteRoom(roomId);
    if (result.success) {
      window.location.href = '/dashboard';
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao excluir sala.' });
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

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
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao salvar configurações.' });
    }
    
    setIsSaving(false);
  };

  const handleAddRule = () => {
    const minInMillions = parseFloat(newRule.min);
    const maxInMillions = newRule.max ? parseFloat(newRule.max) : undefined;
    
    // Validation
    if (isNaN(minInMillions) || minInMillions < 0) {
      alert('Por favor, insira um valor mínimo válido.');
      return;
    }

    if (maxInMillions !== undefined && maxInMillions < minInMillions) {
      alert('O valor máximo deve ser maior ou igual ao valor mínimo.');
      return;
    }

    const min = parseFromMillions(minInMillions);
    const max = maxInMillions !== undefined ? parseFromMillions(maxInMillions) : undefined;

    // Check overlap
    const hasOverlap = settings.contractLogic.rules.some(existingRule => {
      const existingMax = existingRule.maxBid ?? Infinity;
      const newMax = max ?? Infinity;
      return (min <= existingMax && newMax >= existingRule.minBid);
    });

    if (hasOverlap) {
      alert('Esta faixa de valores se sobrepõe a uma regra existente. Por favor, ajuste os valores.');
      return;
    }

    let ruleToAdd: ContractRule;

    if (newRule.durationType === 'fixed') {
      const fixedYears = parseInt(newRule.fixedYears);
      if (isNaN(fixedYears) || fixedYears < 1) {
        alert('Por favor, insira um número válido de anos para duração fixa.');
        return;
      }
      ruleToAdd = { minBid: min, maxBid: max, durationType: 'fixed', years: fixedYears };
    } else if (newRule.durationType === 'min-2') {
      ruleToAdd = { minBid: min, maxBid: max, durationType: 'min-2', minYears: 2 };
    } else if (newRule.durationType === 'min-3') {
      ruleToAdd = { minBid: min, maxBid: max, durationType: 'min-3', minYears: 3 };
    } else if (newRule.durationType === 'min-4') {
      ruleToAdd = { minBid: min, maxBid: max, durationType: 'min-4', minYears: 4 };
    } else {
      ruleToAdd = { minBid: min, maxBid: max, durationType: 'any', minYears: 1 };
    }

    const newRules = [...settings.contractLogic.rules, ruleToAdd].sort((a, b) => a.minBid - b.minBid);
    handleNestedChange('contractLogic', 'rules', newRules);

    // Reset form
    setNewRule({
      min: '',
      max: '',
      durationType: 'any',
      fixedYears: ''
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white">Configurações da Sala</h2>
          <p className="text-slate-400 text-sm mt-1">Gerencie as regras financeiras, de leilão e contratos.</p>
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-right-4 ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            {isSaving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
            Salvar Alterações
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Settings Card */}
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 space-y-6 hover:border-white/20 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Economia</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Budget Inicial</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors">$</span>
                <input
                  type="number"
                  step="0.1"
                  value={toMillionsInput(settings.startingBudget)}
                  onChange={(e) => handleChange('startingBudget', parseFromMillions(Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg pl-7 pr-10 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">M</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                Incremento Mínimo
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-xs text-slate-300 rounded shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Valor mínimo que deve ser adicionado ao lance atual para cobri-lo.
                  </div>
                </div>
              </label>

              <div className="flex p-1 bg-slate-950 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => settings.minIncrement >= 1 && handleChange('minIncrement', 0.15)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                    settings.minIncrement < 1
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Porcentagem
                </button>
                <button
                  type="button"
                  onClick={() => settings.minIncrement < 1 && handleChange('minIncrement', 5000000)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                    settings.minIncrement >= 1
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Valor Fixo
                </button>
              </div>

              <div className="relative group">
                {settings.minIncrement < 1 ? (
                  <>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="100"
                      value={Math.round(settings.minIncrement * 100)}
                      onChange={(e) => handleChange('minIncrement', Number(e.target.value) / 100)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                  </>
                ) : (
                  <>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={toMillionsInput(settings.minIncrement)}
                      onChange={(e) => handleChange('minIncrement', parseFromMillions(Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg pl-7 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">M</span>
                  </>
                )}
              </div>
              
              <div className="text-xs text-slate-500 bg-slate-950/50 p-2 rounded border border-white/5">
                Exemplo: Lance de <strong>100M</strong> → Mínimo: <strong>
                  {settings.minIncrement < 1 
                    ? formatToMillions(Math.ceil(100000000 * (1 + settings.minIncrement)))
                    : formatToMillions(100000000 + settings.minIncrement)
                  }
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Auction Settings Card */}
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 space-y-6 hover:border-white/20 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sky-500/10 rounded-lg">
              <Gavel className="w-5 h-5 text-sky-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Regras do Leilão</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Tempo do Timer (horas)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={settings.timerSeconds / 3600}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) handleChange('timerSeconds', val * 3600);
                }}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              />
              <p className="text-xs text-slate-500 text-right">
                {settings.timerSeconds} segundos
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                Tamanho do Roster
              </label>
              <input
                type="number"
                value={settings.roster.maxRosterSize}
                onChange={(e) => handleNestedChange('roster', 'maxRosterSize', Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Duração Máxima de Contratos
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.maxContractYears}
                onChange={(e) => handleChange('maxContractYears', Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contract Logic Section */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Lógica de Contratos</h3>
              <p className="text-sm text-slate-400">Defina regras de duração baseadas no valor do lance.</p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.contractLogic.enabled}
              onChange={(e) => handleNestedChange('contractLogic', 'enabled', e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {settings.contractLogic.enabled && (
          <div className="p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
            {/* Rules List */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wider">Regras Ativas</h4>
              
              {settings.contractLogic.rules.length === 0 ? (
                <div className="text-center py-8 bg-slate-950/30 rounded-xl border border-dashed border-white/10">
                  <p className="text-slate-500">Nenhuma regra configurada.</p>
                  <p className="text-xs text-slate-600 mt-1">Adicione regras abaixo para controlar a duração dos contratos.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {settings.contractLogic.rules.map((rule, index) => (
                    <div key={index} className="group flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-slate-900 rounded text-sm font-mono text-slate-300 border border-white/5">
                          {formatToMillions(rule.minBid)} <span className="text-slate-600 mx-1">→</span> {rule.maxBid ? formatToMillions(rule.maxBid) : '∞'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-emerald-400 font-medium text-sm">
                            {getContractDurationLabel(rule.durationType, rule.years, rule.minYears)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {rule.durationType === 'any' && 'Livre escolha'}
                            {rule.durationType === 'fixed' && 'Duração fixa'}
                            {rule.durationType.startsWith('min') && 'Duração mínima'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newRules = settings.contractLogic.rules.filter((_, i) => i !== index);
                          handleNestedChange('contractLogic', 'rules', newRules);
                        }}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remover regra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Rule Form */}
            <div className="bg-slate-950/50 p-5 rounded-xl border border-white/10 space-y-4">
              <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Adicionar Nova Regra
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-xs text-slate-400">Mínimo ($M)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={newRule.min}
                    onChange={(e) => setNewRule(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full bg-slate-900 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-xs text-slate-400">Máximo ($M)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="∞"
                    value={newRule.max}
                    onChange={(e) => setNewRule(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full bg-slate-900 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs text-slate-400">Tipo de Duração</label>
                  <select
                    value={newRule.durationType}
                    onChange={(e) => setNewRule(prev => ({ ...prev, durationType: e.target.value as ContractDurationType }))}
                    className="w-full bg-slate-900 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="any">Qualquer duração</option>
                    <option value="min-2">Mínimo de 2 anos</option>
                    <option value="min-3">Mínimo de 3 anos</option>
                    <option value="min-4">Mínimo de 4 anos</option>
                    <option value="fixed">Duração fixa</option>
                  </select>
                </div>

                {newRule.durationType === 'fixed' && (
                  <div className="md:col-span-2 space-y-1.5 animate-in fade-in slide-in-from-left-2">
                    <label className="text-xs text-slate-400">Anos</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newRule.fixedYears}
                      onChange={(e) => setNewRule(prev => ({ ...prev, fixedYears: e.target.value }))}
                      className="w-full bg-slate-900 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                )}

                <div className={`md:col-span-${newRule.durationType === 'fixed' ? '12' : '2'}`}>
                  <button
                    onClick={handleAddRule}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="md:hidden">Adicionar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="pt-8 mt-8">
        <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-red-500 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Zona de Perigo
            </h3>
            <p className="text-sm text-red-400/70">
              Ações irreversíveis que afetam toda a sala.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-500 border border-red-900/50 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Sala
          </button>
        </div>
      </div>

      <DeleteRoomModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleDeleteRoom}
        isDeleting={isDeleting}
      />
    </div>
  );
}

function DeleteRoomModal({ isOpen, onClose, onConfirm, isDeleting }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isDeleting: boolean }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4 text-red-500">
          <div className="p-3 bg-red-500/10 rounded-full">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Excluir Sala?</h3>
        </div>
        
        <p className="text-slate-300 mb-6 leading-relaxed">
          Tem certeza que deseja excluir esta sala? Esta ação é <strong className="text-red-400">irreversível</strong> e apagará todos os dados, incluindo times, jogadores, lances e histórico.
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-red-900/20"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin">⏳</span> Excluindo...
              </>
            ) : (
              'Sim, Excluir Sala'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
