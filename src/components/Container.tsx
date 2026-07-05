import { ReactNode, CSSProperties } from 'react'

type ContainerSize = 'full' | 'reading' | 'form'

interface ContainerProps {
  children: ReactNode
  className?: string
  /** full: site width (grids/nav). reading: article width (wrap detail). form: single-column forms. */
  size?: ContainerSize
  style?: CSSProperties
}

const MAX_WIDTHS: Record<ContainerSize, string> = {
  full: 'max-w-[1200px]',
  reading: 'max-w-4xl',
  form: 'max-w-2xl',
}

export default function Container({ children, className = '', size = 'full', style }: ContainerProps) {
  return (
    <div className={`w-full ${MAX_WIDTHS[size]} mx-auto px-4 sm:px-6 ${className}`} style={style}>
      {children}
    </div>
  )
}
