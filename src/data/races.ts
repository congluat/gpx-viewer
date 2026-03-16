export interface RaceDistance {
  id: string;
  name: string;
  fileName: string;
}

export interface Race {
  id: string;
  name: string;
  folder: string;
  distances: RaceDistance[];
}

export const races: Race[] = [
  {
    id: 'dalat-ultra-trail-2026',
    name: 'Dalat Ultra Trail 2026',
    folder: 'dalat-ultra-trail-2026',
    distances: [
      { id: '100k', name: '100km', fileName: 'DUT 2026 - 100km.gpx' },
      { id: '75k', name: '75km', fileName: 'DUT 2026 - 75km.gpx' },
      { id: '50k', name: '50km', fileName: 'DUT 2026 - 50km.gpx' },
      { id: '21k', name: '21km', fileName: 'DUT 2026 - 21km.gpx' },
      { id: '15k', name: '15km', fileName: 'DUT 2026 - 15km.gpx' },
      { id: '5k', name: '5km', fileName: 'DUT 2026 - 5km.gpx' },
    ],
  },
];

export function getGpxPath(race: Race, distance: RaceDistance): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}gpx/${race.folder}/${distance.fileName}`;
}
