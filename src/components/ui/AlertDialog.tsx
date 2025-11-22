'use client'

import React from 'react'
import { LucideIcon, ShieldAlert, AlertTriangle, Info, AlertCircle } from 'lucide-react'

export type AlertDialogVariant = 'danger' | 'warning' | 'info' | 'default'

export interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: AlertDialogVariant
  icon?: LucideIcon
  isLoading?: boolean
  loadingText?: string
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  icon,
  isLoading = false,
  loadingText = 'Processando...',
}: AlertDialogProps) {
  if (!isOpen) return null

  const variantConfig = {
    danger: {
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      borderColor: 'border-red-500/30',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      buttonShadow: 'shadow-lg shadow-red-900/20',
      defaultIcon: ShieldAlert,
    },
    warning: {
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      borderColor: 'border-amber-500/30',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
      buttonShadow: 'shadow-lg shadow-amber-900/20',
      defaultIcon: AlertTriangle,
    },
    info: {
      iconBg: 'bg-sky-500/10',
      iconColor: 'text-sky-500',
      borderColor: 'border-sky-500/30',
      buttonBg: 'bg-sky-600 hover:bg-sky-700',
      buttonShadow: 'shadow-lg shadow-sky-900/20',
      defaultIcon: Info,
    },
    default: {
      iconBg: 'bg-slate-500/10',
      iconColor: 'text-slate-400',
      borderColor: 'border-slate-500/30',
      buttonBg: 'bg-slate-600 hover:bg-slate-700',
      buttonShadow: 'shadow-lg shadow-slate-900/20',
      defaultIcon: AlertCircle,
    },
  }

  const config = variantConfig[variant]
  const Icon = icon || config.defaultIcon

  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-slate-900 border ${config.borderColor} rounded-xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com ícone */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`${config.iconBg} rounded-full p-3`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
            <div className="text-slate-300 text-sm leading-relaxed">
              {description}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 ${config.buttonBg} text-white rounded-lg font-medium transition-all ${config.buttonShadow} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isLoading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
