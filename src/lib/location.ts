/**
 * Browser geolocation helper functions for DuoCheck.
 * Wraps the Geolocation API with Promise-based helpers and error handling
 * tailored for iPhone Safari.
 */

/** Custom error types for geolocation failures */
export enum LocationErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  UNKNOWN = 'UNKNOWN',
}

export class LocationError extends Error {
  code: LocationErrorCode
  constructor(code: LocationErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'LocationError'
  }
}

/**
 * Wraps navigator.geolocation.getCurrentPosition in a Promise.
 * Provides iPhone-specific guidance when permission is denied.
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new LocationError(
          LocationErrorCode.NOT_SUPPORTED,
          'Geolocation is not supported by your browser.'
        )
      )
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          reject(
            new LocationError(
              LocationErrorCode.PERMISSION_DENIED,
              'Location permission denied. On iPhone: go to Settings → Privacy & Security → Location Services → Safari Websites, and set to "While Using the App". Also check Settings → Safari → Location and ensure it is not set to "Deny".'
            )
          )
          break
        case error.POSITION_UNAVAILABLE:
          reject(
            new LocationError(
              LocationErrorCode.POSITION_UNAVAILABLE,
              'Location information is unavailable. Please ensure Location Services are enabled on your device.'
            )
          )
          break
        case error.TIMEOUT:
          reject(
            new LocationError(
              LocationErrorCode.TIMEOUT,
              'The request to get your location timed out. Please try again.'
            )
          )
          break
        default:
          reject(
            new LocationError(
              LocationErrorCode.UNKNOWN,
              'An unknown error occurred while getting your location.'
            )
          )
          break
      }
    }, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    })
  })
}

/**
 * Formats accuracy in meters for display.
 * @param accuracy - Accuracy in meters, or null
 * @returns Formatted string like "±10 meters" or "Accuracy not available"
 */
export function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null || accuracy === undefined) {
    return 'Accuracy not available'
  }
  const rounded = Math.round(accuracy)
  return `±${rounded} meter${rounded !== 1 ? 's' : ''}`
}

/**
 * Creates an OpenStreetMap URL for a given latitude and longitude.
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns URL string pointing to OpenStreetMap at the given coordinates
 */
export function createOpenStreetMapUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`
}
