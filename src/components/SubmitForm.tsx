'use client'

import { useEffect, useRef, useState } from 'react'
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps'
import { Location } from '@/lib/types'
import { submitWrap } from '@/lib/actions/wraps'

interface PlaceResult {
  name: string
  address: string
  city: string
  lat: number | null
  lng: number | null
}

function PlacesAutocomplete({ onSelect }: { onSelect: (result: PlaceResult) => void }) {
  const places = useMapsLibrary('places')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!places || !containerRef.current) return

    const el = new google.maps.places.PlaceAutocompleteElement({})
    el.style.width = '100%'
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(el)

    el.addEventListener('gmp-select', async (event: Event) => {
      // @ts-expect-error
      const place = event.placePrediction.toPlace()
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'addressComponents', 'location'] })

      const components = place.addressComponents ?? []
      const city =
        components.find((c: { types: string[]; longText: string }) => c.types.includes('locality'))?.longText ??
        components.find((c: { types: string[]; longText: string }) => c.types.includes('administrative_area_level_1'))?.longText ??
        ''

      onSelect({ name: place.displayName ?? '', address: place.formattedAddress ?? '', city, lat: place.location?.lat() ?? null, lng: place.location?.lng() ?? null })
    })

    return () => { if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [places, onSelect])

  return <div ref={containerRef} className="w-full" />
}

interface SubmitFormProps {
  locations: Location[]
}

export default function SubmitForm({ locations }: SubmitFormProps) {
  const [locationMode, setLocationMode] = useState<'existing' | 'new'>(
    locations.length > 0 ? 'existing' : 'new'
  )
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [place, setPlace] = useState<PlaceResult | null>(null)
  const [isChain, setIsChain] = useState(false)
  const [dishPhoto, setDishPhoto] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    fd.set('locationMode', locationMode)

    if (locationMode === 'existing') {
      fd.set('locationId', selectedLocationId)
    } else if (place) {
      fd.set('locationName', place.name)
      fd.set('locationAddress', place.address)
      fd.set('locationCity', place.city)
      fd.set('locationLat', place.lat?.toString() ?? '')
      fd.set('locationLng', place.lng?.toString() ?? '')
      fd.set('isChain', isChain.toString())
    }

    if (dishPhoto) fd.set('photo', dishPhoto)

    const result = await submitWrap(fd)
    if (result?.error) {
      setError(result.error)
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-border bg-card text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <form onSubmit={handleSubmit} className="space-y-10">

        {/* Location */}
        <section>
          <h2 className="font-serif text-xl mb-4">Location</h2>

          {locations.length > 0 && (
            <div className="flex gap-3 mb-4">
              <button type="button" onClick={() => setLocationMode('existing')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${locationMode === 'existing' ? 'bg-accent text-white border-accent' : 'bg-card text-text-muted border-border hover:border-border-strong'}`}>
                Existing location
              </button>
              <button type="button" onClick={() => setLocationMode('new')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${locationMode === 'new' ? 'bg-accent text-white border-accent' : 'bg-card text-text-muted border-border hover:border-border-strong'}`}>
                New location
              </button>
            </div>
          )}

          {locationMode === 'existing' ? (
            <div>
              <label className="block text-sm font-medium mb-1.5">Select location</label>
              <select value={selectedLocationId} onChange={(e) => setSelectedLocationId(e.target.value)} required
                className={inputClass}>
                <option value="">Choose a location…</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} — {loc.city}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Search restaurant</label>
                <PlacesAutocomplete onSelect={setPlace} />
                {place && (
                  <div className="mt-2 p-3 bg-page rounded-lg border border-border text-sm space-y-0.5">
                    <p className="font-medium">{place.name}</p>
                    <p className="text-text-muted">{place.address}</p>
                    {place.city && <p className="text-text-muted">{place.city}</p>}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isChain} onChange={(e) => setIsChain(e.target.checked)} className="rounded border-border accent-accent" />
                <span>This is a chain restaurant</span>
              </label>
            </div>
          )}
        </section>

        {/* Dish details */}
        <section>
          <h2 className="font-serif text-xl mb-4">Dish Details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="wrapName" className="block text-sm font-medium mb-1.5">Dish name</label>
              <input id="wrapName" name="wrapName" type="text" required placeholder="e.g. Chicken Caesar Wrap, Spicy Wings, Smash Burger…" className={inputClass} />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1.5">
                Price <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                <input id="price" name="price" type="number" min="0" step="0.01" placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-border bg-card text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Dish photo <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input type="file" accept="image/*" onChange={(e) => setDishPhoto(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-text-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-border file:text-sm file:font-medium file:bg-card file:text-text hover:file:bg-page transition cursor-pointer" />
            </div>
          </div>
        </section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        )}

        <button type="submit" disabled={submitting}
          className="w-full py-3 px-6 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition disabled:opacity-60 disabled:cursor-not-allowed">
          {submitting ? 'Submitting…' : 'Add dish'}
        </button>
      </form>
    </APIProvider>
  )
}
