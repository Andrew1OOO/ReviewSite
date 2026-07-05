'use client'

import { useEffect, useRef, useState } from 'react'
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps'
import { addReview } from '@/lib/actions/reviews'
import AxisSlider from '@/components/AxisSlider'
import BlockEditor from '@/components/BlockEditor'
import { appendReviewBody, type EditorPhoto } from '@/lib/reviewBody'
import { computeComposite, defaultScores, emptyNotes, type AxisScores, type AxisNotes } from '@/lib/reviewAxes'
import type { Location, RubricAxis } from '@/lib/types'

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
        components.find((c: { types: string[]; longText: string }) => c.types.includes('administrative_area_level_1'))?.longText ?? ''
      onSelect({ name: place.displayName ?? '', address: place.formattedAddress ?? '', city, lat: place.location?.lat() ?? null, lng: place.location?.lng() ?? null })
    })
    return () => { if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [places, onSelect])

  return <div ref={containerRef} className="w-full" />
}

interface ReviewSubmitFormProps {
  locations: Location[]
  axes: RubricAxis[]
  foodCategory: string
}

export default function ReviewSubmitForm({ locations, axes, foodCategory }: ReviewSubmitFormProps) {
  const [locationMode, setLocationMode] = useState<'existing' | 'new'>(
    locations.length > 0 ? 'existing' : 'new'
  )
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [place, setPlace] = useState<PlaceResult | null>(null)
  const [isChain, setIsChain] = useState(false)
  const [scores, setScores] = useState<AxisScores>(defaultScores(axes))
  const [notes, setNotes] = useState<AxisNotes>(emptyNotes(axes))
  const [bodyText, setBodyText] = useState('')
  const [photos, setPhotos] = useState<EditorPhoto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const composite = computeComposite(axes, scores).toFixed(1)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const fd = new FormData()
    fd.set('locationMode', locationMode)

    if (locationMode === 'existing') {
      if (!selectedLocationId) { setError('Please select a location.'); setSubmitting(false); return }
      fd.set('locationId', selectedLocationId)
    } else {
      if (!place) { setError('Please search for a location.'); setSubmitting(false); return }
      fd.set('locationName', place.name)
      fd.set('locationAddress', place.address)
      fd.set('locationCity', place.city)
      fd.set('locationLat', place.lat?.toString() ?? '')
      fd.set('locationLng', place.lng?.toString() ?? '')
      fd.set('isChain', isChain.toString())
    }

    for (const axis of axes) {
      fd.set(`score_${axis.id}`, (scores[axis.id] ?? 5).toString())
      fd.set(`note_${axis.id}`, notes[axis.id] ?? '')
    }

    appendReviewBody(fd, { bodyText, photos })

    const result = await addReview(fd)
    if (result && 'error' in result && result.error) {
      setError(result.error)
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-border bg-card text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <form onSubmit={handleSubmit} className="space-y-10">

        {/* Food category banner */}
        <div className="bg-accent-soft border border-accent/20 rounded-xl px-4 py-3 text-sm">
          Reviewing as: <span className="font-medium text-text">{foodCategory}</span>
        </div>

        {/* Location */}
        <section>
          <h2 className="font-serif text-xl mb-4">Where</h2>

          {locations.length > 0 && (
            <div className="flex gap-3 mb-4">
              <button type="button" onClick={() => setLocationMode('existing')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${locationMode === 'existing' ? 'bg-accent text-white border-accent' : 'bg-card text-text-muted border-border hover:border-border-strong'}`}>
                Existing spot
              </button>
              <button type="button" onClick={() => setLocationMode('new')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${locationMode === 'new' ? 'bg-accent text-white border-accent' : 'bg-card text-text-muted border-border hover:border-border-strong'}`}>
                New spot
              </button>
            </div>
          )}

          {locationMode === 'existing' ? (
            <select value={selectedLocationId} onChange={(e) => setSelectedLocationId(e.target.value)}
              className={inputClass}>
              <option value="">Choose a spot…</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name} — {loc.city}</option>
              ))}
            </select>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Search restaurant</label>
                <PlacesAutocomplete onSelect={setPlace} />
                {place && (
                  <div className="mt-2 p-3 bg-page rounded-lg border border-border text-sm space-y-0.5">
                    <p className="font-medium">{place.name}</p>
                    <p className="text-text-muted">{place.address}</p>
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

        {/* Scores */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl">Score</h2>
            <div className="text-right">
              <span className="text-xs text-text-muted block mb-0.5">Composite</span>
              <span className="score-display text-4xl">{composite}</span>
            </div>
          </div>
          <div className="space-y-6">
            {axes.map((axis) => (
              <AxisSlider
                key={axis.id}
                name={axis.id}
                label={axis.label}
                description={axis.description ?? undefined}
                value={scores[axis.id] ?? 5}
                onChange={(v) => setScores((prev) => ({ ...prev, [axis.id]: v }))}
                note={notes[axis.id] ?? ''}
                onNoteChange={(n) => setNotes((prev) => ({ ...prev, [axis.id]: n }))}
              />
            ))}
          </div>
        </section>

        {/* Write-up */}
        <section>
          <h2 className="font-serif text-xl mb-2">Write-up</h2>
          <p className="text-sm text-text-muted mb-4">
            Optional — add photos in the panel on the right, reference them with{' '}
            <code className="text-xs bg-border/60 px-1 py-0.5 rounded font-mono">[photo:1]</code>.
          </p>
          <BlockEditor
            bodyText={bodyText}
            photos={photos}
            onBodyTextChange={setBodyText}
            onPhotosChange={setPhotos}
          />
        </section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        )}

        <button type="submit" disabled={submitting}
          className="w-full py-3 px-6 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition disabled:opacity-60 disabled:cursor-not-allowed">
          {submitting ? 'Posting…' : 'Post review'}
        </button>
      </form>
    </APIProvider>
  )
}
