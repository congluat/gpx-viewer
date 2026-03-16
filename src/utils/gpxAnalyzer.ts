import GPXParser from 'gpxparser';
import type { TrackPoint, Waypoint, GPXData, GPXSummary, WaypointDistance } from '../types/gpx';
import { haversineDistance, calculateGrade } from './distanceCalculator';
import { detectSlopes } from './slopeDetector';

export function parseGPX(gpxString: string): GPXData {
  const parser = new GPXParser();
  parser.parse(gpxString);
  
  const trackPoints = extractTrackPoints(parser);
  const waypointsWithIndex = extractWaypointsWithIndex(parser, trackPoints);
  const waypoints = waypointsWithIndex.map(w => w.waypoint);
  const slopeSegments = detectSlopes(trackPoints);
  const waypointDistances = calculateWaypointDistances(waypointsWithIndex, trackPoints);
  const summary = calculateSummary(trackPoints);
  const name = parser.metadata?.name || parser.tracks[0]?.name || 'Untitled Track';
  
  return {
    trackPoints,
    waypoints,
    slopeSegments,
    waypointDistances,
    summary,
    name,
  };
}

function extractTrackPoints(parser: GPXParser): TrackPoint[] {
  if (!parser.tracks || parser.tracks.length === 0) {
    return [];
  }
  
  const rawPoints = parser.tracks[0].points;
  const trackPoints: TrackPoint[] = [];
  let cumulativeDistance = 0;
  
  for (let i = 0; i < rawPoints.length; i++) {
    const point = rawPoints[i];
    
    if (i > 0) {
      const prevPoint = rawPoints[i - 1];
      const segmentDistance = haversineDistance(
        prevPoint.lat,
        prevPoint.lon,
        point.lat,
        point.lon
      );
      cumulativeDistance += segmentDistance;
    }
    
    let grade = 0;
    if (i > 0) {
      const prevPoint = rawPoints[i - 1];
      const segmentDistance = haversineDistance(
        prevPoint.lat,
        prevPoint.lon,
        point.lat,
        point.lon
      );
      const elevationChange = point.ele - prevPoint.ele;
      grade = calculateGrade(segmentDistance, elevationChange);
    }
    
    trackPoints.push({
      lat: point.lat,
      lon: point.lon,
      elevation: point.ele || 0,
      time: point.time,
      distance: cumulativeDistance,
      grade: grade,
    });
  }
  
  return trackPoints;
}

interface WaypointWithIndex {
  waypoint: Waypoint;
  trackIndex: number;
}

function extractWaypointsWithIndex(parser: GPXParser, trackPoints: TrackPoint[]): WaypointWithIndex[] {
  if (!parser.waypoints) {
    return [];
  }
  
  return parser.waypoints.map((wp) => {
    let minDistance = Infinity;
    let distanceFromStart = 0;
    let nearestIndex = 0;
    
    for (let i = 0; i < trackPoints.length; i++) {
      const tp = trackPoints[i];
      const dist = haversineDistance(wp.lat, wp.lon, tp.lat, tp.lon);
      if (dist < minDistance) {
        minDistance = dist;
        distanceFromStart = tp.distance;
        nearestIndex = i;
      }
    }
    
    return {
      waypoint: {
        name: wp.name || 'Waypoint',
        lat: wp.lat,
        lon: wp.lon,
        elevation: wp.ele || 0,
        description: wp.desc || '',
        distanceFromStart,
      },
      trackIndex: nearestIndex,
    };
  }).sort((a, b) => a.waypoint.distanceFromStart - b.waypoint.distanceFromStart);
}

function calculateWaypointDistances(
  waypointsWithIndex: WaypointWithIndex[],
  trackPoints: TrackPoint[]
): WaypointDistance[] {
  const distances: WaypointDistance[] = [];
  
  for (let i = 0; i < waypointsWithIndex.length - 1; i++) {
    const fromWp = waypointsWithIndex[i];
    const toWp = waypointsWithIndex[i + 1];
    
    let elevationGain = 0;
    let elevationLoss = 0;
    
    for (let j = fromWp.trackIndex; j < toWp.trackIndex && j < trackPoints.length - 1; j++) {
      const elevChange = trackPoints[j + 1].elevation - trackPoints[j].elevation;
      if (elevChange > 0) {
        elevationGain += elevChange;
      } else {
        elevationLoss += Math.abs(elevChange);
      }
    }
    
    distances.push({
      from: fromWp.waypoint,
      to: toWp.waypoint,
      distance: toWp.waypoint.distanceFromStart - fromWp.waypoint.distanceFromStart,
      elevationChange: toWp.waypoint.elevation - fromWp.waypoint.elevation,
      elevationGain,
      elevationLoss,
      fromIndex: fromWp.trackIndex,
      toIndex: toWp.trackIndex,
    });
  }
  
  return distances;
}

function calculateSummary(trackPoints: TrackPoint[]): GPXSummary {
  if (trackPoints.length === 0) {
    return {
      totalDistance: 0,
      totalElevationGain: 0,
      totalElevationLoss: 0,
      maxElevation: 0,
      minElevation: 0,
      startElevation: 0,
      endElevation: 0,
    };
  }
  
  let totalElevationGain = 0;
  let totalElevationLoss = 0;
  let maxElevation = trackPoints[0].elevation;
  let minElevation = trackPoints[0].elevation;
  
  for (let i = 1; i < trackPoints.length; i++) {
    const elevChange = trackPoints[i].elevation - trackPoints[i - 1].elevation;
    
    if (elevChange > 0) {
      totalElevationGain += elevChange;
    } else {
      totalElevationLoss += Math.abs(elevChange);
    }
    
    maxElevation = Math.max(maxElevation, trackPoints[i].elevation);
    minElevation = Math.min(minElevation, trackPoints[i].elevation);
  }
  
  return {
    totalDistance: trackPoints[trackPoints.length - 1].distance,
    totalElevationGain,
    totalElevationLoss,
    maxElevation,
    minElevation,
    startElevation: trackPoints[0].elevation,
    endElevation: trackPoints[trackPoints.length - 1].elevation,
  };
}
