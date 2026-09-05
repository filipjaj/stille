import React from 'react'

export type StatTrend = 'up' | 'down' | 'flat'

export type StatCardProps = {
  label: React.ReactNode
  value: React.ReactNode
  /** Endringstall, f.eks. "+12%" eller "−4%". Fortegnet styrer retning når `trend` ikke er satt. */
  delta?: React.ReactNode
  deltaLabel?: React.ReactNode
  trend?: StatTrend
  className?: string
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className'>

/**
 * StatCard — nøkkeltall med ink-strek øverst: etikett, serif-verdi og delta
 * mot forrige periode. Portert fra designsystemets components/admin/StatCard.jsx.
 */
export function StatCard({
  label,
  value,
  delta,
  deltaLabel = 'vs. forrige uke',
  trend,
  className,
  ...rest
}: StatCardProps) {
  const dir: StatTrend =
    trend ??
    (typeof delta === 'string'
      ? delta.startsWith('-') || delta.startsWith('−')
        ? 'down'
        : delta.startsWith('+')
          ? 'up'
          : 'flat'
      : 'flat')

  const classes = ['st-stat', className].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      <span className="st-stat-label">{label}</span>
      <span className="st-stat-value">{value}</span>
      {delta != null && (
        <span className={['st-stat-delta', dir].filter(Boolean).join(' ')}>
          <b>{delta}</b>
          <span>{deltaLabel}</span>
        </span>
      )}
    </div>
  )
}
