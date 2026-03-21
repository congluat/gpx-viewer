import { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, ScaleControl, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useGPX } from '../context/GPXContext';
import { getSlopeColor } from '../utils/slopeDetector';
import { haversineDistance } from '../utils/distanceCalculator';
import 'leaflet/dist/leaflet.css';

interface UserPosition {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
}

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

const userLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="18" fill="#3b82f6" fill-opacity="0.2" stroke="#3b82f6" stroke-width="2"/>
      <circle cx="20" cy="20" r="8" fill="#3b82f6" stroke="white" stroke-width="3"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function UserLocationMarker({ position, gpxData }: { position: UserPosition; gpxData: typeof import('../context/GPXContext').useGPX extends () => { gpxData: infer T } ? T : never }) {
  const nearestPoint = useMemo(() => {
    if (!gpxData || gpxData.trackPoints.length === 0) return null;

    let minDist = Infinity;
    let nearest = gpxData.trackPoints[0];

    for (const tp of gpxData.trackPoints) {
      const dist = haversineDistance(position.lat, position.lon, tp.lat, tp.lon);
      if (dist < minDist) {
        minDist = dist;
        nearest = tp;
      }
    }

    return { point: nearest, distanceFromTrack: minDist * 1000 }; // Convert to meters
  }, [position, gpxData]);

  return (
    <>
      <Circle
        center={[position.lat, position.lon]}
        radius={position.accuracy}
        pathOptions={{ 
          color: '#3b82f6', 
          fillColor: '#3b82f6', 
          fillOpacity: 0.1,
          weight: 1
        }}
      />
      <Marker position={[position.lat, position.lon]} icon={userLocationIcon}>
        <Popup>
          <div className="text-sm">
            <p className="font-bold text-blue-600">Vị trí của bạn</p>
            <p><strong>Độ chính xác:</strong> ±{position.accuracy.toFixed(0)}m</p>
            {nearestPoint && (
              <>
                <p><strong>Km trên track:</strong> {nearestPoint.point.distance.toFixed(2)}</p>
                <p><strong>Cách track:</strong> {nearestPoint.distanceFromTrack.toFixed(0)}m</p>
              </>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
}

function GPSToggleButton({ isTracking, onClick, error }: { isTracking: boolean; onClick: () => void; error: string | null }) {
  return (
    <button
      onClick={onClick}
      className={`gps-toggle ${isTracking ? 'active' : ''} ${error ? 'error' : ''}`}
      title={error || (isTracking ? 'Tắt GPS' : 'Bật GPS')}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {isTracking && <span className="gps-pulse"></span>}
    </button>
  );
}

interface GPSInfoPanelProps {
  position: UserPosition;
  gpxData: NonNullable<ReturnType<typeof useGPX>['gpxData']>;
}

function GPSInfoPanel({ position, gpxData }: GPSInfoPanelProps) {
  const info = useMemo(() => {
    if (!gpxData || gpxData.trackPoints.length === 0) return null;

    // Find nearest point on track
    let minDist = Infinity;
    let nearestIndex = 0;
    for (let i = 0; i < gpxData.trackPoints.length; i++) {
      const tp = gpxData.trackPoints[i];
      const dist = haversineDistance(position.lat, position.lon, tp.lat, tp.lon);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }

    const currentKm = gpxData.trackPoints[nearestIndex].distance;
    const totalKm = gpxData.summary.totalDistance;
    const remainingKm = totalKm - currentKm;

    // Find next checkpoint
    let nextCheckpoint = null;
    for (const wp of gpxData.waypoints) {
      if (wp.distanceFromStart > currentKm) {
        nextCheckpoint = {
          name: wp.name,
          distanceToGo: wp.distanceFromStart - currentKm,
          elevation: wp.elevation,
        };
        break;
      }
    }

    // Find next slope segment
    let nextSlope = null;
    for (const segment of gpxData.slopeSegments) {
      if (segment.startDistance > currentKm) {
        nextSlope = {
          type: segment.type,
          distanceToStart: segment.startDistance - currentKm,
          length: segment.length,
          elevationGain: segment.elevationGain,
          averageGrade: segment.averageGrade,
        };
        break;
      }
    }

    return {
      currentKm,
      remainingKm,
      nextCheckpoint,
      nextSlope,
    };
  }, [position, gpxData]);

  if (!info) return null;

  return (
    <div className="gps-info-panel">
      {/* Current position */}
      <div className="gps-info-row">
        <span className="gps-info-label">Vị trí hiện tại</span>
        <span className="gps-info-value text-blue-600">Km {info.currentKm.toFixed(2)}</span>
      </div>
      <div className="gps-info-row">
        <span className="gps-info-label">Còn lại</span>
        <span className="gps-info-value">{info.remainingKm.toFixed(2)} km</span>
      </div>

      {/* Next checkpoint */}
      {info.nextCheckpoint && (
        <div className="gps-info-section">
          <div className="gps-info-title">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            CP tiếp theo
          </div>
          <div className="gps-info-row">
            <span className="gps-info-label">{info.nextCheckpoint.name}</span>
            <span className="gps-info-value text-blue-600">{info.nextCheckpoint.distanceToGo.toFixed(2)} km</span>
          </div>
        </div>
      )}

      {/* Next slope */}
      {info.nextSlope && (
        <div className="gps-info-section">
          <div className="gps-info-title">
            {info.nextSlope.type === 'uphill' ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            Dốc tiếp theo
          </div>
          <div className="gps-info-row">
            <span className="gps-info-label">Loại</span>
            <span className={`gps-info-value ${info.nextSlope.type === 'uphill' ? 'text-green-600' : 'text-red-600'}`}>
              {info.nextSlope.type === 'uphill' ? 'Leo dốc' : 'Xuống dốc'}
            </span>
          </div>
          <div className="gps-info-row">
            <span className="gps-info-label">Cách</span>
            <span className="gps-info-value">{info.nextSlope.distanceToStart.toFixed(2)} km</span>
          </div>
          <div className="gps-info-row">
            <span className="gps-info-label">Độ dài</span>
            <span className="gps-info-value">{info.nextSlope.length.toFixed(2)} km</span>
          </div>
          <div className="gps-info-row">
            <span className="gps-info-label">{info.nextSlope.type === 'uphill' ? 'Lên' : 'Xuống'}</span>
            <span className={`gps-info-value ${info.nextSlope.type === 'uphill' ? 'text-green-600' : 'text-red-600'}`}>
              {info.nextSlope.type === 'uphill' ? '+' : ''}{info.nextSlope.elevationGain.toFixed(0)}m ({Math.abs(info.nextSlope.averageGrade).toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapView() {
  const { gpxData, error } = useGPX();
  const [isTracking, setIsTracking] = useState(false);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ GPS');
      return;
    }

    setGpsError(null);
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setGpsError(null);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError('Bạn đã từ chối quyền truy cập vị trí');
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsError('Không thể xác định vị trí');
            break;
          case err.TIMEOUT:
            setGpsError('Hết thời gian chờ GPS');
            break;
          default:
            setGpsError('Lỗi GPS không xác định');
        }
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
    setWatchId(id);
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    setUserPosition(null);
  }, [watchId]);

  const toggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking, startTracking, stopTracking]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

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
        {userPosition && <UserLocationMarker position={userPosition} gpxData={gpxData} />}
      </MapContainer>
      <SlopeLegend />
      <GPSToggleButton isTracking={isTracking} onClick={toggleTracking} error={gpsError} />
      {isTracking && userPosition && <GPSInfoPanel position={userPosition} gpxData={gpxData} />}
    </div>
  );
}
