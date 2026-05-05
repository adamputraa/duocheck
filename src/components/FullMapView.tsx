/**
 * FullMapView component for DuoCheck.
 * Full-screen Leaflet map for the /map page with markers for user,
 * partner, and SOS events. Includes stale location warning banner.
 */

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertTriangle } from 'lucide-react'
import { formatRelativeTime, isStale } from '@/lib/date'

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

interface SosEvent {
  latitude: number
  longitude: number
  user_id: string
  created_at: string
}

interface FullMapViewProps {
  ownLocation: LocationData | null
  partnerLocation: LocationData | null
  sosEvents: Array<SosEvent>
  ownName: string
  partnerName: string
  staleThresholdHours: number
}

/** Creates a custom colored circle marker using divIcon */
function createColoredMarker(color: string, size: number = 24): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  })
}

/** Creates a pulsing SOS marker */
function createSosMarker(): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 32px;
      height: 32px;
      background-color: #EF4444;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
      animation: sos-pulse 2s infinite;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 10px;
    ">SOS</div>
    <style>
      @keyframes sos-pulse {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
        70% { box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      }
    </style>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  })
}

const OWN_MARKER = createColoredMarker('#D97756')
const PARTNER_MARKER = createColoredMarker('#B85C38')
const SOS_MARKER = createSosMarker()

/** Component that fits map bounds to visible markers */
function FitBounds({
  ownLocation,
  partnerLocation,
  sosEvents,
}: {
  ownLocation: LocationData | null
  partnerLocation: LocationData | null
  sosEvents: Array<SosEvent>
}) {
  const map = useMap()
  const prevBoundsRef = useRef<string>('')

  useEffect(() => {
    const points: L.LatLngExpression[] = []

    if (ownLocation) points.push([ownLocation.latitude, ownLocation.longitude])
    if (partnerLocation) points.push([partnerLocation.latitude, partnerLocation.longitude])
    sosEvents.forEach((e) => points.push([e.latitude, e.longitude]))

    if (points.length === 0) return

    const boundsKey = points.map((p) => p.toString()).join('|')
    if (boundsKey === prevBoundsRef.current) return
    prevBoundsRef.current = boundsKey

    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true })
    } else {
      const bounds = L.latLngBounds(points as L.LatLngExpression[])
      map.fitBounds(bounds, { padding: [50, 50], animate: true })
    }
  }, [map, ownLocation, partnerLocation, sosEvents])

  return null
}

export default function FullMapView({
  ownLocation,
  partnerLocation,
  sosEvents,
  ownName,
  partnerName,
  staleThresholdHours,
}: FullMapViewProps) {
  // Determine if partner location is stale
  const partnerStale =
    partnerLocation && isStale(partnerLocation.created_at, staleThresholdHours)
  const ownStale =
    ownLocation && isStale(ownLocation.created_at, staleThresholdHours)

  // Default center
  const center: [number, number] = ownLocation
    ? [ownLocation.latitude, ownLocation.longitude]
    : partnerLocation
      ? [partnerLocation.latitude, partnerLocation.longitude]
      : [3.139, 101.6869] // Default: KL, Malaysia

  return (
    <div className="relative" style={{ height: 'calc(100dvh - 60px)' }}>
      {/* Stale location warning banner */}
      {(partnerStale || ownStale) && (
        <div className="absolute top-0 left-0 right-0 z-[1000] bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <span className="text-xs text-amber-800">
            {partnerStale && ownStale
              ? 'Location updates may be outdated'
              : partnerStale
                ? `${partnerName}'s location may be outdated`
                : 'Your location may be outdated'}
          </span>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds
          ownLocation={ownLocation}
          partnerLocation={partnerLocation}
          sosEvents={sosEvents}
        />

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

        {sosEvents.map((event, index) => (
          <Marker
            key={`sos-${index}-${event.created_at}`}
            position={[event.latitude, event.longitude]}
            icon={SOS_MARKER}
          >
            <Popup>
              <div className="text-xs">
                <strong className="text-red-600">SOS Alert</strong>
                <br />
                <span className="text-gray-500">
                  {formatRelativeTime(event.created_at)}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
