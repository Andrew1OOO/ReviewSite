'use client'

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'

interface LocationMiniMapProps {
  lat: number
  lng: number
  name: string
  mapId: string
}

export default function LocationMiniMap({ lat, lng, name, mapId }: LocationMiniMapProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height: 180 }}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map
          defaultCenter={{ lat, lng }}
          defaultZoom={14}
          mapId={mapId}
          disableDefaultUI
          gestureHandling="none"
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker position={{ lat, lng }} title={name}>
            <Pin background="var(--accent)" borderColor="var(--accent-hover)" glyphColor="#fff" />
          </AdvancedMarker>
        </Map>
      </APIProvider>
    </div>
  )
}
