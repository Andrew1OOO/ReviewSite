'use client'

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  MapControl,
  ControlPosition,
  ColorScheme,
  useMap,
} from '@vis.gl/react-google-maps'
import Link from 'next/link'
import { useState } from 'react'

export interface ReviewMapPin {
  locationId: string
  name: string
  lat: number
  lng: number
  composite: number | null
}

interface ReviewMapProps {
  pins: ReviewMapPin[]
}

function tierColor(composite: number | null) {
  if (composite === null) return { bg: '#6E675A', border: '#4E4839' }
  if (composite >= 90)    return { bg: '#2F7D4E', border: '#1f5c39' }
  if (composite >= 75)    return { bg: '#2A6BB0', border: '#1d4f85' }
  if (composite >= 50)    return { bg: '#C68A1A', border: '#9a6b14' }
  return                         { bg: '#C0392B', border: '#922b21' }
}

function tierLabel(composite: number | null) {
  if (composite === null) return null
  if (composite >= 90) return 'Must Try'
  if (composite >= 75) return 'Solid'
  if (composite >= 50) return 'Mid'
  return 'Skip It'
}

// Zoom buttons injected via MapControl so they sit inside the map canvas
function ZoomControls() {
  const map = useMap()
  const btn =
    'w-8 h-8 flex items-center justify-center bg-card/95 border border-border text-text text-lg font-light hover:bg-page transition leading-none select-none'
  return (
    <MapControl position={ControlPosition.RIGHT_BOTTOM}>
      <div className="flex flex-col rounded-lg overflow-hidden border border-border shadow-sm mr-2.5 mb-2.5">
        <button
          type="button"
          aria-label="Zoom in"
          className={`${btn} border-b`}
          onClick={() => map && map.setZoom((map.getZoom() ?? 10) + 1)}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          className={btn}
          onClick={() => map && map.setZoom((map.getZoom() ?? 10) - 1)}
        >
          −
        </button>
      </div>
    </MapControl>
  )
}

function MapInner({ pins }: ReviewMapProps) {
  const [active, setActive] = useState<string | null>(null)
  const centerLat = pins.reduce((s, p) => s + p.lat, 0) / pins.length
  const centerLng = pins.reduce((s, p) => s + p.lng, 0) / pins.length
  const activePin = pins.find((p) => p.locationId === active)

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-border"
      style={{ height: 380 }}
    >
      <Map
        defaultCenter={{ lat: centerLat, lng: centerLng }}
        defaultZoom={pins.length === 1 ? 13 : 10}
        mapId="profile-review-map"
        colorScheme={ColorScheme.FOLLOW_SYSTEM}
        disableDefaultUI
        keyboardShortcuts
        gestureHandling="greedy"
        style={{ width: '100%', height: '100%' }}
      >
        {pins.map((pin) => {
          const { bg, border } = tierColor(pin.composite)
          const isActive = active === pin.locationId
          return (
            <AdvancedMarker
              key={pin.locationId}
              position={{ lat: pin.lat, lng: pin.lng }}
              title={pin.name}
              zIndex={isActive ? 10 : 1}
              onClick={() => setActive(isActive ? null : pin.locationId)}
            >
              <Pin
                background={bg}
                borderColor={border}
                glyphColor="#fff"
                scale={isActive ? 1.35 : 1}
              />
            </AdvancedMarker>
          )
        })}

        <ZoomControls />
      </Map>

      {/* Active pin card */}
      {activePin && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-card/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 min-w-[230px] max-w-[90%]"
          style={{ animation: 'fade-up 0.18s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate">{activePin.name}</p>
            {tierLabel(activePin.composite) && (
              <p className="text-xs text-text-muted mt-0.5">{tierLabel(activePin.composite)}</p>
            )}
          </div>
          <span className="score-display text-2xl shrink-0">
            {activePin.composite !== null ? activePin.composite.toFixed(1) : '—'}
          </span>
          <Link
            href={`/locations/${activePin.locationId}`}
            className="btn text-xs px-3 py-1.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition shrink-0"
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => setActive(null)}
            className="text-text-muted hover:text-text transition text-lg leading-none shrink-0"
            aria-label="Close"
          >×</button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2.5 space-y-1.5">
        {(
          [
            { label: 'Must Try', color: '#2F7D4E' },
            { label: 'Solid',    color: '#2A6BB0' },
            { label: 'Mid',      color: '#C68A1A' },
            { label: 'Skip It',  color: '#C0392B' },
          ] as const
        ).map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-xs text-text-muted leading-none">{label}</span>
          </div>
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-3 right-14 z-10 bg-card/80 backdrop-blur-sm border border-border rounded-md px-2 py-1">
        <span className="text-xs text-text-muted">Scroll or arrow keys to navigate</span>
      </div>
    </div>
  )
}

export default function ReviewMap({ pins }: ReviewMapProps) {
  if (pins.length === 0) {
    return (
      <div className="h-48 rounded-xl bg-card border border-border flex items-center justify-center">
        <p className="text-sm text-text-muted">No reviewed locations with coordinates yet.</p>
      </div>
    )
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <MapInner pins={pins} />
    </APIProvider>
  )
}
