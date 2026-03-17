import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import { useGPX } from '../context/GPXContext';
import { getSlopeColor } from '../utils/slopeDetector';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const hoverIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="#ef4444" stroke="white" stroke-width="3"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const waypointIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="#3b82f6"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  `),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

const startIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle cx="16" cy="16" r="14" fill="#22c55e" stroke="white" stroke-width="3"/>
      <polygon points="12,9 12,23 24,16" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const finishIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="white" stroke-width="3"/>
      <rect x="10" y="8" width="12" height="16" fill="white" rx="1"/>
      <rect x="12" y="10" width="3" height="3" fill="#ef4444"/>
      <rect x="17" y="10" width="3" height="3" fill="#ef4444"/>
      <rect x="12" y="14.5" width="3" height="3" fill="#ef4444"/>
      <rect x="17" y="14.5" width="3" height="3" fill="#ef4444"/>
      <rect x="12" y="19" width="3" height="3" fill="#ef4444"/>
      <rect x="17" y="19" width="3" height="3" fill="#ef4444"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

function createKmIcon(km: number) {
  return new L.DivIcon({
    className: 'km-marker',
    html: `<div class="km-label">${km}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function MapController() {
  const map = useMap();
  const { gpxData } = useGPX();

  useEffect(() => {
    if (gpxData && gpxData.trackPoints.length > 0) {
      const bounds = L.latLngBounds(
        gpxData.trackPoints.map((p) => [p.lat, p.lon] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [gpxData, map]);

  return null;
}

function TrackLine() {
  const { gpxData } = useGPX();

  const coloredSegments = useMemo(() => {
    if (!gpxData) return [];

    const segments: Array<{
      positions: [number, number][];
      color: string;
    }> = [];

    for (let i = 0; i < gpxData.trackPoints.length - 1; i++) {
      const p1 = gpxData.trackPoints[i];
      const p2 = gpxData.trackPoints[i + 1];
      const avgGrade = (p1.grade + p2.grade) / 2;
      const color = getSlopeColor(avgGrade);

      if (segments.length > 0 && segments[segments.length - 1].color === color) {
        segments[segments.length - 1].positions.push([p2.lat, p2.lon]);
      } else {
        segments.push({
          positions: [[p1.lat, p1.lon], [p2.lat, p2.lon]],
          color,
        });
      }
    }

    return segments;
  }, [gpxData]);

  return (
    <>
      {coloredSegments.map((segment, index) => (
        <Polyline
          key={index}
          positions={segment.positions}
          color={segment.color}
          weight={4}
          opacity={0.8}
        />
      ))}
    </>
  );
}

function HoverMarker() {
  const { hoverPoint } = useGPX();

  if (!hoverPoint) return null;

  return (
    <Marker position={[hoverPoint.lat, hoverPoint.lon]} icon={hoverIcon}>
      <Popup>
        <div className="text-sm">
          <p><strong>Độ cao:</strong> {hoverPoint.elevation.toFixed(0)}m</p>
          <p><strong>Khoảng cách:</strong> {hoverPoint.distance.toFixed(2)}km</p>
          <p><strong>Độ dốc:</strong> {hoverPoint.grade.toFixed(1)}%</p>
        </div>
      </Popup>
    </Marker>
  );
}

function createWaypointIcon(index: number) {
  return new L.DivIcon({
    className: 'waypoint-marker',
    html: `
      <div class="waypoint-container">
        <div class="waypoint-pin"></div>
        <div class="waypoint-label">CP${index + 1}</div>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  });
}

function Waypoints() {
  const { gpxData } = useGPX();

  if (!gpxData) return null;

  return (
    <>
      {gpxData.waypoints.map((wp, index) => (
        <Marker key={index} position={[wp.lat, wp.lon]} icon={createWaypointIcon(index)}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold">{wp.name}</p>
              {wp.description && <p className="text-gray-600">{wp.description}</p>}
              <p><strong>Độ cao:</strong> {wp.elevation.toFixed(0)}m</p>
              <p><strong>Km:</strong> {wp.distanceFromStart.toFixed(2)}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function StartFinishMarkers() {
  const { gpxData } = useGPX();

  if (!gpxData || gpxData.trackPoints.length < 2) return null;

  const startPoint = gpxData.trackPoints[0];
  const finishPoint = gpxData.trackPoints[gpxData.trackPoints.length - 1];

  return (
    <>
      <Marker position={[startPoint.lat, startPoint.lon]} icon={startIcon}>
        <Popup>
          <div className="text-sm">
            <p className="font-bold text-green-600">Điểm xuất phát</p>
            <p><strong>Độ cao:</strong> {startPoint.elevation.toFixed(0)}m</p>
          </div>
        </Popup>
      </Marker>
      <Marker position={[finishPoint.lat, finishPoint.lon]} icon={finishIcon}>
        <Popup>
          <div className="text-sm">
            <p className="font-bold text-red-600">Điểm kết thúc</p>
            <p><strong>Độ cao:</strong> {finishPoint.elevation.toFixed(0)}m</p>
            <p><strong>Tổng quãng đường:</strong> {finishPoint.distance.toFixed(2)}km</p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

function KilometerMarkers() {
  const { gpxData } = useGPX();

  const kmPoints = useMemo(() => {
    if (!gpxData || gpxData.trackPoints.length < 2) return [];

    const points: Array<{ km: number; lat: number; lon: number; elevation: number }> = [];
    let nextKm = 1;

    for (let i = 1; i < gpxData.trackPoints.length; i++) {
      const point = gpxData.trackPoints[i];
      const prevPoint = gpxData.trackPoints[i - 1];

      if (point.distance >= nextKm && prevPoint.distance < nextKm) {
        const ratio = (nextKm - prevPoint.distance) / (point.distance - prevPoint.distance);
        const lat = prevPoint.lat + ratio * (point.lat - prevPoint.lat);
        const lon = prevPoint.lon + ratio * (point.lon - prevPoint.lon);
        const elevation = prevPoint.elevation + ratio * (point.elevation - prevPoint.elevation);

        points.push({ km: nextKm, lat, lon, elevation });
        nextKm++;
      }
    }

    return points;
  }, [gpxData]);

  return (
    <>
      {kmPoints.map((point) => (
        <Marker
          key={point.km}
          position={[point.lat, point.lon]}
          icon={createKmIcon(point.km)}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold">Km {point.km}</p>
              <p><strong>Độ cao:</strong> {point.elevation.toFixed(0)}m</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function SlopeLegend() {
  const legends = [
    { color: '#22c55e', label: '< 5%', desc: 'Dễ' },
    { color: '#eab308', label: '5-10%', desc: 'Trung bình' },
    { color: '#f97316', label: '10-15%', desc: 'Khó' },
    { color: '#ef4444', label: '> 15%', desc: 'Rất khó' },
  ];

  return (
    <div className="slope-legend">
      <div className="text-xs font-semibold mb-1 text-gray-700">Độ dốc</div>
      {legends.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5 text-xs">
          <div
            className="w-4 h-2 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function MapView() {
  const { gpxData, error } = useGPX();

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!gpxData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <div className="text-gray-400 text-6xl mb-4">🗺️</div>
          <p className="text-gray-500">Tải file GPX để xem bản đồ</p>
        </div>
      </div>
    );
  }

  const center: [number, number] = gpxData.trackPoints.length > 0
    ? [gpxData.trackPoints[0].lat, gpxData.trackPoints[0].lon]
    : [21.0285, 105.8542]; // Hanoi default

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ScaleControl position="bottomright" metric={true} imperial={false} />
        <MapController />
        <TrackLine />
        <KilometerMarkers />
        <StartFinishMarkers />
        <HoverMarker />
        <Waypoints />
      </MapContainer>
      <SlopeLegend />
    </div>
  );
}
