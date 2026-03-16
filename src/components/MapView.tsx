import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
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

function Waypoints() {
  const { gpxData } = useGPX();

  if (!gpxData) return null;

  return (
    <>
      {gpxData.waypoints.map((wp, index) => (
        <Marker key={index} position={[wp.lat, wp.lon]} icon={waypointIcon}>
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
      <MapController />
      <TrackLine />
      <HoverMarker />
      <Waypoints />
    </MapContainer>
  );
}
