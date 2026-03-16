import { useEffect, useCallback } from 'react';
import { races } from '../data/races';

export interface RouteParams {
  raceId: string | null;
  distanceId: string | null;
}

export function parseRouteFromUrl(): RouteParams {
  const hash = window.location.hash.slice(1); // Remove #
  if (!hash) return { raceId: null, distanceId: null };

  const parts = hash.split('/');
  if (parts.length >= 2) {
    return {
      raceId: parts[0] || null,
      distanceId: parts[1] || null,
    };
  }
  
  return { raceId: parts[0] || null, distanceId: null };
}

export function updateUrlRoute(raceId: string, distanceId: string) {
  const newHash = `#${raceId}/${distanceId}`;
  if (window.location.hash !== newHash) {
    window.history.pushState(null, '', newHash);
  }
}

export function findRaceAndDistance(raceId: string | null, distanceId: string | null) {
  if (!raceId || !distanceId) return null;
  
  const race = races.find(r => r.id === raceId);
  if (!race) return null;
  
  const distance = race.distances.find(d => d.id === distanceId);
  if (!distance) return null;
  
  return { race, distance };
}

export function useRouteParams(onRouteChange: (params: RouteParams) => void) {
  const handleHashChange = useCallback(() => {
    const params = parseRouteFromUrl();
    onRouteChange(params);
  }, [onRouteChange]);

  useEffect(() => {
    // Handle initial load
    handleHashChange();
    
    // Listen for hash changes (back/forward navigation)
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleHashChange]);
}
