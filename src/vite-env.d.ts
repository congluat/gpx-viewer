/// <reference types="vite/client" />

declare module 'gpxparser' {
  export default class GPXParser {
    constructor();
    parse(gpxString: string): void;
    tracks: Array<{
      name: string;
      points: Array<{
        lat: number;
        lon: number;
        ele: number;
        time: Date | null;
      }>;
      distance: { total: number };
      elevation: { max: number; min: number; pos: number; neg: number };
    }>;
    waypoints: Array<{
      name: string;
      lat: number;
      lon: number;
      ele: number;
      desc: string;
    }>;
    metadata: {
      name: string;
      desc: string;
      author: { name: string };
      time: Date | null;
    };
  }
}
