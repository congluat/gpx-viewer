export interface TrackPoint {
  lat: number;
  lon: number;
  elevation: number;
  time: Date | null;
  distance: number; // cumulative distance in km
  grade: number; // gradient percentage at this point
}

export interface Waypoint {
  name: string;
  lat: number;
  lon: number;
  elevation: number;
  description: string;
  distanceFromStart: number; // distance from track start in km
}

export interface SlopeSegment {
  id: number;
  startIndex: number;
  endIndex: number;
  startDistance: number; // km
  endDistance: number; // km
  length: number; // km
  elevationGain: number; // meters (positive for uphill, negative for downhill)
  averageGrade: number; // percentage
  maxGrade: number; // percentage
  type: 'uphill' | 'downhill' | 'flat';
}

export interface WaypointDistance {
  from: Waypoint;
  to: Waypoint;
  distance: number; // km
  elevationChange: number; // meters (net change)
  elevationGain: number; // meters (total climb)
  elevationLoss: number; // meters (total descent)
  fromIndex: number; // track point index
  toIndex: number; // track point index
}

export interface GPXSummary {
  totalDistance: number; // km
  totalElevationGain: number; // meters
  totalElevationLoss: number; // meters
  maxElevation: number; // meters
  minElevation: number; // meters
  startElevation: number; // meters
  endElevation: number; // meters
}

export interface GPXData {
  trackPoints: TrackPoint[];
  waypoints: Waypoint[];
  slopeSegments: SlopeSegment[];
  waypointDistances: WaypointDistance[];
  summary: GPXSummary;
  name: string;
}
