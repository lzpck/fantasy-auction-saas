'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gavel, AlertCircle } from 'lucide-react';
import { AuctionSettings } from '@/types/auction-settings';

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
  const [amount, setAmount] = useState<number>(0);
  const [years, setYears] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate minimum bid based on settings
  const minIncrement = settings.minIncrement || 1;
  let minBid = 1;
  if (currentBid > 0) {
    if (minIncrement < 1) {
      minBid = Math.ceil(currentBid * (1 + minIncrement));
    } else {
      minBid = currentBid + minIncrement;
    }
  }

  useEffect(() => {
    if (isOpen) {
      setAmount(minBid);
      setYears(1);
      setError(null);
    }
  }, [isOpen, minBid]);

  // Validate contract years based on amount and rules
  useEffect(() => {
    if (!settings.contractLogic?.enabled) return;

    const rules = settings.contractLogic.rules;
    if (!rules || rules.length === 0) return;

    const rule = rules.find((r) => 
      amount >= r.minBid && (!r.maxBid || amount <= r.maxBid)
    );

    if (rule) {
      setYears(rule.years);
    } else {
        // If amount is higher than all rules, find the highest rule
        const maxRule = [...rules].sort((a, b) => b.minBid - a.minBid)[0];
        if (maxRule && amount > maxRule.minBid) {
            setYears(maxRule.years);
        }
    }
  }, [amount, settings.contractLogic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount < minBid) {
      setError(`O lance mínimo é $${minBid}`);
      return;
    }

    if (amount > myBudget) {
      setError(`Saldo insuficiente (Disp: $${myBudget})`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onBid(amount, years);
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
                  <label className="text-sm font-medium text-slate-400">Valor do Lance ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-8 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      min={minBid}
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Mínimo: ${minBid}</span>
                    <span>Seu Saldo: ${myBudget}</span>
                  </div>
                </div>

                {/* Contract Years Display/Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Contrato (Anos)</label>
                  <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-lg font-mono text-slate-300 flex items-center justify-between">
                    <span>{years} {years === 1 ? 'Ano' : 'Anos'}</span>
                    {settings.contractLogic?.enabled && (
                       <span className="text-xs text-emerald-500 bg-emerald-950/30 px-2 py-1 rounded">Automático</span>
                    )}
                  </div>
                   {settings.contractLogic?.enabled && (
                    <p className="text-xs text-slate-500">
                      Calculado automaticamente baseado no valor do lance.
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
