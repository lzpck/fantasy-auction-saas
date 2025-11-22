import React from 'react'
import { LucideIcon, Inbox } from 'lucide-react'

export interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  message: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <div className="bg-slate-800/50 rounded-full p-4 mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      {title && (
        <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
      )}
      <p className="text-slate-500 text-sm max-w-md mb-6">{message}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
