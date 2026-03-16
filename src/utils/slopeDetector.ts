import type { TrackPoint, SlopeSegment } from '../types/gpx';

const MIN_SLOPE_GRADE = 3; // minimum 3% grade to be considered a slope
const MIN_SLOPE_LENGTH = 0.1; // minimum 100m length
const SMOOTHING_WINDOW = 5; // points to average for smoothing

function smoothGrades(points: TrackPoint[]): number[] {
  const smoothed: number[] = [];
  
  for (let i = 0; i < points.length; i++) {
    let sum = 0;
    let count = 0;
    
    for (let j = Math.max(0, i - SMOOTHING_WINDOW); j <= Math.min(points.length - 1, i + SMOOTHING_WINDOW); j++) {
      sum += points[j].grade;
      count++;
    }
    
    smoothed.push(sum / count);
  }
  
  return smoothed;
}

function getSlopeType(grade: number): 'uphill' | 'downhill' | 'flat' {
  if (grade >= MIN_SLOPE_GRADE) return 'uphill';
  if (grade <= -MIN_SLOPE_GRADE) return 'downhill';
  return 'flat';
}

export function detectSlopes(trackPoints: TrackPoint[]): SlopeSegment[] {
  if (trackPoints.length < 2) return [];
  
  const smoothedGrades = smoothGrades(trackPoints);
  const segments: SlopeSegment[] = [];
  
  let segmentStart = 0;
  let currentType = getSlopeType(smoothedGrades[0]);
  let maxGradeInSegment = smoothedGrades[0];
  
  for (let i = 1; i < trackPoints.length; i++) {
    const type = getSlopeType(smoothedGrades[i]);
    
    if (type !== currentType || i === trackPoints.length - 1) {
      const endIndex = i === trackPoints.length - 1 ? i : i - 1;
      const startPoint = trackPoints[segmentStart];
      const endPoint = trackPoints[endIndex];
      
      const length = endPoint.distance - startPoint.distance;
      const elevationGain = endPoint.elevation - startPoint.elevation;
      
      // Only include significant slopes (not flat sections)
      if (currentType !== 'flat' && length >= MIN_SLOPE_LENGTH) {
        const avgGrade = length > 0 ? (elevationGain / (length * 1000)) * 100 : 0;
        
        segments.push({
          id: segments.length + 1,
          startIndex: segmentStart,
          endIndex: endIndex,
          startDistance: startPoint.distance,
          endDistance: endPoint.distance,
          length: length,
          elevationGain: elevationGain,
          averageGrade: avgGrade,
          maxGrade: maxGradeInSegment,
          type: currentType,
        });
      }
      
      segmentStart = i;
      currentType = type;
      maxGradeInSegment = smoothedGrades[i];
    } else {
      if (currentType === 'uphill' && smoothedGrades[i] > maxGradeInSegment) {
        maxGradeInSegment = smoothedGrades[i];
      } else if (currentType === 'downhill' && smoothedGrades[i] < maxGradeInSegment) {
        maxGradeInSegment = smoothedGrades[i];
      }
    }
  }
  
  return segments;
}

export function getSlopeColor(grade: number): string {
  const absGrade = Math.abs(grade);
  
  if (absGrade < 3) return '#22c55e'; // green - easy
  if (absGrade < 6) return '#eab308'; // yellow - moderate
  if (absGrade < 10) return '#f97316'; // orange - hard
  if (absGrade < 15) return '#ef4444'; // red - very hard
  return '#7c2d12'; // dark red - extreme
}

export function getSlopeDifficulty(grade: number): string {
  const absGrade = Math.abs(grade);
  
  if (absGrade < 3) return 'Dễ';
  if (absGrade < 6) return 'Trung bình';
  if (absGrade < 10) return 'Khó';
  if (absGrade < 15) return 'Rất khó';
  return 'Cực khó';
}
