import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { GPXData, TrackPoint } from '../types/gpx';
import { parseGPX } from '../utils/gpxAnalyzer';
import { findNearestPointIndex } from '../utils/distanceCalculator';

interface GPXContextType {
  gpxData: GPXData | null;
  currentGpxUrl: string | null;
  hoverPoint: TrackPoint | null;
  hoverIndex: number | null;
  isLoading: boolean;
  error: string | null;
  loadGPX: (file: File) => Promise<void>;
  loadGPXFromUrl: (url: string, name?: string) => Promise<void>;
  setHoverDistance: (distance: number | null) => void;
  setHoverIndex: (index: number | null) => void;
  clearData: () => void;
}

const GPXContext = createContext<GPXContextType | null>(null);

export function GPXProvider({ children }: { children: ReactNode }) {
  const [gpxData, setGpxData] = useState<GPXData | null>(null);
  const [currentGpxUrl, setCurrentGpxUrl] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState<TrackPoint | null>(null);
  const [hoverIndex, setHoverIndexState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGPX = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const data = parseGPX(text);
      
      if (data.trackPoints.length === 0) {
        throw new Error('File GPX không chứa track nào');
      }
      
      setGpxData(data);
      setCurrentGpxUrl(null);
      setHoverPoint(null);
      setHoverIndexState(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi đọc file GPX';
      setError(message);
      setGpxData(null);
      setCurrentGpxUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadGPXFromUrl = useCallback(async (url: string, name?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Không tìm thấy file: ${url}`);
      }
      const text = await response.text();
      const data = parseGPX(text);
      
      if (data.trackPoints.length === 0) {
        throw new Error('File GPX không chứa track nào');
      }
      
      if (name) {
        data.name = name;
      }
      
      setGpxData(data);
      setCurrentGpxUrl(url);
      setHoverPoint(null);
      setHoverIndexState(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi đọc file GPX';
      setError(message);
      setGpxData(null);
      setCurrentGpxUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setHoverDistance = useCallback((distance: number | null) => {
    if (!gpxData || distance === null) {
      setHoverPoint(null);
      setHoverIndexState(null);
      return;
    }
    
    const index = findNearestPointIndex(gpxData.trackPoints, distance);
    if (index >= 0 && index < gpxData.trackPoints.length) {
      setHoverPoint(gpxData.trackPoints[index]);
      setHoverIndexState(index);
    }
  }, [gpxData]);

  const setHoverIndex = useCallback((index: number | null) => {
    if (!gpxData || index === null) {
      setHoverPoint(null);
      setHoverIndexState(null);
      return;
    }
    
    if (index >= 0 && index < gpxData.trackPoints.length) {
      setHoverPoint(gpxData.trackPoints[index]);
      setHoverIndexState(index);
    }
  }, [gpxData]);

  const clearData = useCallback(() => {
    setGpxData(null);
    setCurrentGpxUrl(null);
    setHoverPoint(null);
    setHoverIndexState(null);
    setError(null);
  }, []);

  return (
    <GPXContext.Provider
      value={{
        gpxData,
        currentGpxUrl,
        hoverPoint,
        hoverIndex,
        isLoading,
        error,
        loadGPX,
        loadGPXFromUrl,
        setHoverDistance,
        setHoverIndex,
        clearData,
      }}
    >
      {children}
    </GPXContext.Provider>
  );
}

export function useGPX() {
  const context = useContext(GPXContext);
  if (!context) {
    throw new Error('useGPX must be used within a GPXProvider');
  }
  return context;
}
