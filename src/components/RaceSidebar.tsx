import { useState, useCallback, useRef } from 'react';
import { races, getGpxPath, type Race, type RaceDistance } from '../data/races';
import { useGPX } from '../context/GPXContext';
import { 
  useRouteParams, 
  updateUrlRoute, 
  findRaceAndDistance,
  type RouteParams 
} from '../hooks/useRouteParams';

interface RaceSidebarProps {
  onSelect?: () => void;
}

export default function RaceSidebar({ onSelect }: RaceSidebarProps) {
  const [expandedRace, setExpandedRace] = useState<string | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<{
    race: Race;
    distance: RaceDistance;
  } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { loadGPXFromUrl, error } = useGPX();
  const initialLoadDone = useRef(false);

  const loadFromRoute = useCallback(async (params: RouteParams) => {
    const found = findRaceAndDistance(params.raceId, params.distanceId);
    if (found) {
      const { race, distance } = found;
      const id = `${race.id}-${distance.id}`;
      
      setExpandedRace(race.id);
      setLoadingId(id);
      setSelectedDistance({ race, distance });
      
      const path = getGpxPath(race, distance);
      await loadGPXFromUrl(path, `${race.name} - ${distance.name}`);
      
      setLoadingId(null);
    } else if (!initialLoadDone.current) {
      // Auto-expand first race if no route
      if (races.length === 1) {
        setExpandedRace(races[0].id);
      }
    }
    initialLoadDone.current = true;
  }, [loadGPXFromUrl]);

  useRouteParams(loadFromRoute);

  const handleRaceClick = (raceId: string) => {
    setExpandedRace(expandedRace === raceId ? null : raceId);
  };

  const handleDistanceClick = async (race: Race, distance: RaceDistance) => {
    const id = `${race.id}-${distance.id}`;
    setLoadingId(id);
    setSelectedDistance({ race, distance });
    
    // Update URL
    updateUrlRoute(race.id, distance.id);
    
    const path = getGpxPath(race, distance);
    await loadGPXFromUrl(path, `${race.name} - ${distance.name}`);
    
    setLoadingId(null);
    onSelect?.();
  };

  const isSelected = (race: Race, distance: RaceDistance) => {
    return (
      selectedDistance?.race.id === race.id &&
      selectedDistance?.distance.id === distance.id
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="font-bold text-gray-800">Chọn giải đua</h2>
        <p className="text-xs text-gray-500 mt-1">
          {races.length} giải đua có sẵn
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {races.map((race) => (
          <div key={race.id} className="border-b border-gray-200">
            <button
              onClick={() => handleRaceClick(race.id)}
              className={`w-full px-4 py-3 text-left flex items-center justify-between
                hover:bg-gray-100 transition-colors
                ${expandedRace === race.id ? 'bg-blue-50' : ''}`}
            >
              <span className="font-medium text-gray-700">{race.name}</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedRace === race.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {expandedRace === race.id && (
              <div className="bg-white">
                {race.distances.map((distance) => {
                  const id = `${race.id}-${distance.id}`;
                  const isLoading = loadingId === id;
                  const selected = isSelected(race, distance);

                  return (
                    <button
                      key={distance.id}
                      onClick={() => handleDistanceClick(race, distance)}
                      disabled={isLoading}
                      className={`w-full px-6 py-2 text-left text-sm flex items-center gap-2
                        transition-colors border-l-2
                        ${
                          selected
                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                            : 'border-transparent hover:bg-gray-50 text-gray-600'
                        }
                        ${isLoading ? 'opacity-50' : ''}`}
                    >
                      {isLoading ? (
                        <svg
                          className="animate-spin h-4 w-4 text-blue-500"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            selected ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        />
                      )}
                      {distance.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border-t border-red-200">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="p-3 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-400">
          Đặt file GPX vào: <code className="bg-gray-100 px-1 rounded">public/gpx/[folder]/</code>
        </p>
      </div>
    </div>
  );
}
