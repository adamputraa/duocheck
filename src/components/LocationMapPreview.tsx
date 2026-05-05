/**
 * LocationMapPreview component for DuoCheck.
 * Small embedded Leaflet map for the dashboard showing own and partner locations.
 * Uses custom colored markers and fit bounds to visible markers.
 */

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin } from 'lucide-react'
import { formatRelativeTime } from '@/lib/date'
import EmptyStateCard from '@/components/EmptyStateCard'

// Fix default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface LocationData {
  latitude: number
  longitude: number
  status: string
  created_at: string
}

interface LocationMapPreviewProps {
  ownLocation: LocationData | null
  partnerLocation: LocationData | null
  ownName: string
  partnerName: string
  onViewFullMap: () => void
}

/** Creates a custom colored circle marker using divIcon */
function createColoredMarker(color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  })
}

const OWN_MARKER = createColoredMarker('#D97756')
const PARTNER_MARKER = createColoredMarker('#B85C38')

/** Component that fits map bounds to visible markers */
function FitBounds({
  ownLocation,
  partnerLocation,
}: {
  ownLocation: LocationData | null
  partnerLocation: LocationData | null
}) {
  const map = useMap()
  const prevBoundsRef = useRef<string>('')

  useEffect(() => {
    const points: L.LatLngExpression[] = []

    if (ownLocation) {
      points.push([ownLocation.latitude, ownLocation.longitude])
    }
    if (partnerLocation) {
      points.push([partnerLocation.latitude, partnerLocation.longitude])
    }

    if (points.length === 0) return

    const boundsKey = points.map((p) => p.toString()).join('|')
    if (boundsKey === prevBoundsRef.current) return
    prevBoundsRef.current = boundsKey

    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true })
    } else {
      const bounds = L.latLngBounds(points as L.LatLngExpression[])
      map.fitBounds(bounds, { padding: [40, 40], animate: true })
    }
  }, [map, ownLocation, partnerLocation])

  return null
}

export default function LocationMapPreview({
  ownLocation,
  partnerLocation,
  ownName,
  partnerName,
  onViewFullMap,
}: LocationMapPreviewProps) {
  // No locations to show
  if (!ownLocation && !partnerLocation) {
    return (
      <EmptyStateCard
        icon={<MapPin className="w-5 h-5" />}
        title="No location shared yet"
        description="Share your location or wait for your partner to check in."
      />
    )
  }

  // Default center: use own location or partner location
  const center: [number, number] = ownLocation
    ? [ownLocation.latitude, ownLocation.longitude]
    : partnerLocation
      ? [partnerLocation.latitude, partnerLocation.longitude]
      : [0, 0]

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-border-light shadow-sm cursor-pointer"
      style={{ height: 200 }}
      onClick={onViewFullMap}
      role="button"
      tabIndex={0}
      aria-label="Tap to view full map"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onViewFullMap()
      }}
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds ownLocation={ownLocation} partnerLocation={partnerLocation} />

        {ownLocation && (
          <Marker
            position={[ownLocation.latitude, ownLocation.longitude]}
            icon={OWN_MARKER}
          >
            <Popup>
              <div className="text-xs">
                <strong>{ownName}</strong>
                <br />
                {ownLocation.status || 'Location updated'}
                <br />
                <span className="text-gray-500">
                  {formatRelativeTime(ownLocation.created_at)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {partnerLocation && (
          <Marker
            position={[partnerLocation.latitude, partnerLocation.longitude]}
            icon={PARTNER_MARKER}
          >
            <Popup>
              <div className="text-xs">
                <strong>{partnerName}</strong>
                <br />
                {partnerLocation.status || 'Location updated'}
                <br />
                <span className="text-gray-500">
                  {formatRelativeTime(partnerLocation.created_at)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Tap overlay hint */}
      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 text-[10px] text-text-muted shadow-sm pointer-events-none">
        Tap to expand
      </div>
    </div>
  )
}
