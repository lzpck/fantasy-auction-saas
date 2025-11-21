'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gavel, AlertCircle, Info } from 'lucide-react';
import { AuctionSettings, ContractRule, validateContractYears, getContractDurationLabel } from '@/types/auction-settings';
import { parseFromMillions, toMillionsInput, formatToMillions } from '@/lib/format-millions';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBid: (amount: number, contractYears: number) => Promise<void>;
  playerName: string;
  currentBid: number;
  settings: AuctionSettings;
  myBudget: number;
}

export function BidModal({
  isOpen,
  onClose,
  onBid,
  playerName,
  currentBid,
  settings,
  myBudget,
}: BidModalProps) {
  // Store amount in millions for input display
  const [amountInMillions, setAmountInMillions] = useState<number>(0);
  const [years, setYears] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRule, setCurrentRule] = useState<ContractRule | null>(null);
  const [yearsWarning, setYearsWarning] = useState<string | null>(null);

  // Calculate minimum bid based on settings
  const minIncrement = settings.minIncrement || 1000000; // Default 1M
  let minBid = 1000000; // Default 1M
  if (currentBid > 0) {
    if (minIncrement < 1) {
      // Percentage-based increment
      minBid = Math.ceil(currentBid * (1 + minIncrement));
    } else {
      // Fixed amount increment (already in millions)
      minBid = currentBid + minIncrement;
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Convert minBid to millions for display
      setAmountInMillions(toMillionsInput(minBid));
      setYears(1);
      setError(null);
      setYearsWarning(null);
      setCurrentRule(null);
    }
  }, [isOpen, minBid]);

  // Find and apply contract rule based on amount
  useEffect(() => {
    if (!settings.contractLogic?.enabled) {
      setCurrentRule(null);
      return;
    }

    const rules = settings.contractLogic.rules;
    if (!rules || rules.length === 0) {
      setCurrentRule(null);
      return;
    }

    // Convert millions to actual value for rule comparison
    const actualAmount = parseFromMillions(amountInMillions);

    const rule = rules.find((r) =>
      actualAmount >= r.minBid && (!r.maxBid || actualAmount <= r.maxBid)
    );

    if (rule) {
      setCurrentRule(rule);

      // Set default years based on rule type
      if (rule.durationType === 'fixed') {
        setYears(rule.years || 1);
      } else if (rule.durationType === 'any') {
        // Keep current years or set to 1
        setYears(prev => prev || 1);
      } else {
        // For min-X types, set to minimum
        setYears(rule.minYears || 1);
      }
    } else {
      // If amount is higher than all rules, find the highest rule
      const maxRule = [...rules].sort((a, b) => b.minBid - a.minBid)[0];
      if (maxRule && actualAmount > maxRule.minBid) {
        setCurrentRule(maxRule);
        if (maxRule.durationType === 'fixed') {
          setYears(maxRule.years || 1);
        } else if (maxRule.durationType !== 'any') {
          setYears(maxRule.minYears || 1);
        }
      } else {
        setCurrentRule(null);
      }
    }
  }, [amountInMillions, settings.contractLogic]);

  // Validate years when they change
  useEffect(() => {
    if (!currentRule || !settings.contractLogic?.enabled) {
      setYearsWarning(null);
      return;
    }

    const validation = validateContractYears(currentRule, years, settings.maxContractYears || 4);
    if (!validation.valid && validation.message) {
      setYearsWarning(validation.message);
    } else {
      setYearsWarning(null);
    }
  }, [years, currentRule, settings.contractLogic, settings.maxContractYears]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Convert millions to actual value
    const actualAmount = parseFromMillions(amountInMillions);

    if (actualAmount < minBid) {
      setError(`O lance mínimo é ${formatToMillions(minBid)}`);
      return;
    }

    if (actualAmount > myBudget) {
      setError(`Saldo insuficiente (Disp: ${formatToMillions(myBudget)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onBid(actualAmount, years);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao dar lance';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <Gavel className="text-emerald-500" size={20} />
                  Novo Lance: <span className="text-emerald-400">{playerName}</span>
                </h3>
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                
                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Valor do Lance (em Milhões)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.1"
                      value={amountInMillions}
                      onChange={(e) => setAmountInMillions(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-8 pr-12 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      min={toMillionsInput(minBid)}
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">M</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Mínimo: {formatToMillions(minBid)}</span>
                    <span>Seu Saldo: {formatToMillions(myBudget)}</span>
                  </div>
                </div>

                {/* Contract Years Display/Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    Contrato (Anos)
                    {currentRule && (
                      <span className="text-xs text-sky-400 bg-sky-950/30 px-2 py-0.5 rounded">
                        {getContractDurationLabel(currentRule.durationType, currentRule.years, currentRule.minYears)}
                      </span>
                    )}
                  </label>

                  {/* Show input if rule allows selection */}
                  {settings.contractLogic?.enabled && currentRule && currentRule.durationType !== 'fixed' ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={years}
                        onChange={(e) => setYears(Number(e.target.value))}
                        min={currentRule.minYears || 1}
                        max={10}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-lg font-mono text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                      {currentRule.durationType !== 'any' && (
                        <div className="flex items-start gap-2 bg-blue-950/20 border border-blue-900/30 rounded-lg p-2">
                          <Info className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-blue-300">
                            {currentRule.durationType === 'min-2' && 'Você pode escolher 2 anos ou mais'}
                            {currentRule.durationType === 'min-3' && 'Você pode escolher 3 anos ou mais'}
                            {currentRule.durationType === 'min-4' && 'Você pode escolher 4 anos ou mais'}
                          </p>
                        </div>
                      )}
                      {yearsWarning && (
                        <div className="flex items-start gap-2 bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-2">
                          <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-yellow-300">{yearsWarning}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-lg font-mono text-slate-300 flex items-center justify-between">
                      <span>{years} {years === 1 ? 'Ano' : 'Anos'}</span>
                      {settings.contractLogic?.enabled && currentRule?.durationType === 'fixed' && (
                        <span className="text-xs text-emerald-500 bg-emerald-950/30 px-2 py-1 rounded">Automático</span>
                      )}
                    </div>
                  )}

                  {settings.contractLogic?.enabled && currentRule?.durationType === 'fixed' && (
                    <p className="text-xs text-slate-500">
                      Duração automática de {years} ano{years !== 1 ? 's' : ''} para esta faixa de valor.
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-rose-950/30 border border-rose-900/50 text-rose-300 p-3 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      CONFIRMAR LANCE
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
