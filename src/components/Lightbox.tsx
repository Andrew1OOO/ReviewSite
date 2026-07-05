'use client'

import { useEffect, useRef } from 'react'

interface LightboxProps {
  src: string
  alt: string
  onClose: () => void
}

export default function Lightbox({ src, alt, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  // Close on backdrop click (click outside the image)
  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose()
  }

  // Close on Escape (dialog handles this natively, but we need to sync state)
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault()
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleClick}
      onCancel={handleCancel}
      className="
        fixed inset-0 m-auto max-w-[90vw] max-h-[90vh] w-auto h-auto
        bg-transparent border-0 p-0
        backdrop:bg-black/80 backdrop:backdrop-blur-sm
        focus:outline-none
      "
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-w-[90vw] max-h-[90vh] w-auto h-auto rounded-xl block"
        />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </dialog>
  )
}
