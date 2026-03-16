const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
}

export function calculateGrade(
  distance: number, // in km
  elevationChange: number // in meters
): number {
  if (distance === 0) return 0;
  const distanceInMeters = distance * 1000;
  return (elevationChange / distanceInMeters) * 100;
}

export function findNearestPointIndex(
  trackPoints: Array<{ distance: number }>,
  targetDistance: number
): number {
  if (trackPoints.length === 0) return -1;
  
  let left = 0;
  let right = trackPoints.length - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (trackPoints[mid].distance < targetDistance) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  
  if (left > 0) {
    const prevDiff = Math.abs(trackPoints[left - 1].distance - targetDistance);
    const currDiff = Math.abs(trackPoints[left].distance - targetDistance);
    if (prevDiff < currDiff) {
      return left - 1;
    }
  }
  
  return left;
}
