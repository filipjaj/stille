import React from 'react'

/**
 * Phosphor Icons (MIT), portert fra designprosjektets
 * _ref/components/core/icons.js. Kun glyfene flatene i repoet bruker er tatt med —
 * legg til flere ved å kopiere `viewBox` og `paths` fra samme fil.
 */
export type IconName = 'arrow-right' | 'spinner-gap'

export type IconWeight = 'light' | 'thin'

type IconDefinition = {
  viewBox: string
  paths: string[]
}

const icons: Record<string, IconDefinition> = {
  'arrow-right-light': {
    viewBox: '0 0 256 256',
    paths: [
      'M220.24,132.24l-72,72a6,6,0,0,1-8.48-8.48L201.51,134H40a6,6,0,0,1,0-12H201.51L139.76,60.24a6,6,0,0,1,8.48-8.48l72,72A6,6,0,0,1,220.24,132.24Z',
    ],
  },
  'arrow-right-thin': {
    viewBox: '0 0 256 256',
    paths: [
      'M218.83,130.83l-72,72a4,4,0,0,1-5.66-5.66L206.34,132H40a4,4,0,0,1,0-8H206.34L141.17,58.83a4,4,0,0,1,5.66-5.66l72,72A4,4,0,0,1,218.83,130.83Z',
    ],
  },
  'spinner-gap-light': {
    viewBox: '0 0 256 256',
    paths: [
      'M134,32V64a6,6,0,0,1-12,0V32a6,6,0,0,1,12,0Zm90,90H192a6,6,0,0,0,0,12h32a6,6,0,0,0,0-12Zm-46.5,47A6,6,0,0,0,169,177.5l22.63,22.62a6,6,0,0,0,8.48-8.48ZM128,186a6,6,0,0,0-6,6v32a6,6,0,0,0,12,0V192A6,6,0,0,0,128,186ZM78.5,169,55.88,191.64a6,6,0,1,0,8.48,8.48L87,177.5A6,6,0,1,0,78.5,169ZM70,128a6,6,0,0,0-6-6H32a6,6,0,0,0,0,12H64A6,6,0,0,0,70,128ZM64.36,55.88a6,6,0,0,0-8.48,8.48L78.5,87A6,6,0,1,0,87,78.5Z',
    ],
  },
  'spinner-gap-thin': {
    viewBox: '0 0 256 256',
    paths: [
      'M132,32V64a4,4,0,0,1-8,0V32a4,4,0,0,1,8,0Zm92,92H192a4,4,0,0,0,0,8h32a4,4,0,0,0,0-8Zm-47.92,46.43a4,4,0,1,0-5.65,5.65l22.62,22.63a4,4,0,0,0,5.66-5.66ZM128,188a4,4,0,0,0-4,4v32a4,4,0,0,0,8,0V192A4,4,0,0,0,128,188ZM79.92,170.43,57.29,193.05A4,4,0,0,0,63,198.71l22.62-22.63a4,4,0,1,0-5.65-5.65ZM68,128a4,4,0,0,0-4-4H32a4,4,0,0,0,0,8H64A4,4,0,0,0,68,128ZM63,57.29A4,4,0,0,0,57.29,63L79.92,85.57a4,4,0,1,0,5.65-5.65Z',
    ],
  },
}

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
  name?: IconName
  /** Light til kontroller, thin til store display-piler. */
  weight?: IconWeight
  size?: number
  spin?: boolean
  /** Setter role="img" og aria-label. Uten den er ikonet aria-hidden. */
  label?: string
}

export function Icon({
  name = 'arrow-right',
  weight = 'light',
  size = 22,
  spin = false,
  className,
  label,
  ...rest
}: IconProps) {
  const definition = icons[`${name}-${weight}`] ?? icons[`${name}-light`]
  if (!definition) {
    return null
  }

  const classes = ['st-icon', spin ? 'st-spin' : null, className].filter(Boolean).join(' ')

  return (
    <svg
      className={classes}
      width={size}
      height={size}
      viewBox={definition.viewBox}
      fill="currentColor"
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
      {...rest}
    >
      {definition.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
