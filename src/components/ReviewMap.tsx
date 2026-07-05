'use client'

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
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

function tierColor(composite: number | null): { background: string; border: string; glyph: string } {
  if (composite === null) return { background: '#6E675A', border: '#4E4839', glyph: '#fff' }
  if (composite >= 8)  return { background: '#2F7D4E', border: '#1f5c39', glyph: '#fff' } // Must Try
  if (composite >= 6)  return { background: '#2A6BB0', border: '#1d4f85', glyph: '#fff' } // Solid
  if (composite >= 4)  return { background: '#C68A1A', border: '#9a6b14', glyph: '#fff' } // Mid
  return                      { background: '#C0392B', border: '#922b21', glyph: '#fff' } // Skip It
}

export default function ReviewMap({ pins }: ReviewMapProps) {
  const [active, setActive] = useState<string | null>(null)

  if (pins.length === 0) {
    return (
      <div className="h-64 rounded-xl bg-card border border-border flex items-center justify-center">
        <p className="text-sm text-text-muted">No reviewed locations with coordinates yet.</p>
      </div>
    )
  }

  // Centre on the mean of all pins
  const centerLat = pins.reduce((s, p) => s + p.lat, 0) / pins.length
  const centerLng = pins.reduce((s, p) => s + p.lng, 0) / pins.length

  const activePin = pins.find((p) => p.locationId === active)

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: 340 }}>
        <Map
          defaultCenter={{ lat: centerLat, lng: centerLng }}
          defaultZoom={pins.length === 1 ? 13 : 10}
          mapId="profile-review-map"
          disableDefaultUI
          gestureHandling="cooperative"
          style={{ width: '100%', height: '100%' }}
        >
          {pins.map((pin) => {
            const colors = tierColor(pin.composite)
            return (
              <AdvancedMarker
                key={pin.locationId}
                position={{ lat: pin.lat, lng: pin.lng }}
                title={pin.name}
                onClick={() => setActive(active === pin.locationId ? null : pin.locationId)}
              >
                <Pin
                  background={colors.background}
                  borderColor={colors.border}
                  glyphColor={colors.glyph}
                  scale={active === pin.locationId ? 1.3 : 1}
                />
              </AdvancedMarker>
            )
          })}
        </Map>

        {/* Popup tooltip */}
        {activePin && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-4 py-3 shadow-lg flex items-center gap-4 min-w-[220px] max-w-[90%]">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{activePin.name}</p>
            </div>
            <span className="score-display text-xl shrink-0">
              {activePin.composite !== null ? activePin.composite.toFixed(1) : '—'}
            </span>
            <Link
              href={`/locations/${activePin.locationId}`}
              className="text-xs text-accent hover:underline shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              View →
            </Link>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 space-y-1">
          {[
            { label: 'Must Try', color: '#2F7D4E' },
            { label: 'Solid',    color: '#2A6BB0' },
            { label: 'Mid',      color: '#C68A1A' },
            { label: 'Skip It',  color: '#C0392B' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-xs text-text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </APIProvider>
  )
}
