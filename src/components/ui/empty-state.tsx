'use client'

import { ReactNode } from 'react'
import { SearchX, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  asTableRow?: boolean
  colSpan?: number
  className?: string
}

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  asTableRow = false,
  colSpan = 1,
  className,
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <Icon className="h-10 w-10 text-slate-300" />
      <div>
        <p className="text-sm font-bold text-slate-500">{title}</p>
        {description && <p className="text-xs text-slate-400 mt-1 max-w-[240px]">{description}</p>}
      </div>
      {action && (
        <Button
          variant="outline"
          size="sm"
          {...(action.href ? { asChild: true } : { onClick: action.onClick })}
        >
          {action.href ? <a href={action.href}>{action.label}</a> : action.label}
        </Button>
      )}
    </div>
  )

  if (asTableRow) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className={cn('py-16 text-center', className)}>
          {content}
        </TableCell>
      </TableRow>
    )
  }

  return <div className={cn('flex flex-col items-center justify-center py-16 gap-3', className)}>{content}</div>
}
