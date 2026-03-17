import { useMemo } from 'react';
import { useGPX } from '../context/GPXContext';

function calculateElevationStats(trackPoints: Array<{ elevation: number }>, startIdx: number, endIdx: number) {
  let gain = 0;
  let loss = 0;
  
  for (let i = startIdx + 1; i <= endIdx; i++) {
    const diff = trackPoints[i].elevation - trackPoints[i - 1].elevation;
    if (diff > 0) {
      gain += diff;
    } else {
      loss += Math.abs(diff);
    }
  }
  
  return { gain, loss };
}

export default function WaypointDistances() {
  const { gpxData, setHoverIndex } = useGPX();

  const startToFirstCPStats = useMemo(() => {
    if (!gpxData || gpxData.waypoints.length === 0) return null;
    
    const firstCP = gpxData.waypoints[0];
    const cpIndex = gpxData.trackPoints.findIndex(p => 
      Math.abs(p.distance - firstCP.distanceFromStart) < 0.01
    );
    const endIdx = cpIndex >= 0 ? cpIndex : gpxData.trackPoints.findIndex(p => p.distance >= firstCP.distanceFromStart);
    
    if (endIdx <= 0) return { gain: 0, loss: 0 };
    return calculateElevationStats(gpxData.trackPoints, 0, endIdx);
  }, [gpxData]);

  const lastCPToFinishStats = useMemo(() => {
    if (!gpxData || gpxData.waypoints.length === 0) return null;
    
    const lastCP = gpxData.waypoints[gpxData.waypoints.length - 1];
    const startIdx = gpxData.trackPoints.findIndex(p => p.distance >= lastCP.distanceFromStart);
    
    if (startIdx < 0 || startIdx >= gpxData.trackPoints.length - 1) return { gain: 0, loss: 0 };
    return calculateElevationStats(gpxData.trackPoints, startIdx, gpxData.trackPoints.length - 1);
  }, [gpxData]);

  if (!gpxData || gpxData.waypoints.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        Không có checkpoint trong file GPX
      </div>
    );
  }

  const firstCheckpoint = gpxData.waypoints[0];
  const lastCheckpoint = gpxData.waypoints[gpxData.waypoints.length - 1];

  const distanceToFirstCP = firstCheckpoint.distanceFromStart;
  const distanceFromLastCPToFinish = gpxData.summary.totalDistance - lastCheckpoint.distanceFromStart;

  if (gpxData.waypointDistances.length === 0) {
    return (
      <div className="space-y-3">
        {/* Start to first CP */}
        <StartToFirstCP 
          distance={distanceToFirstCP}
          cpName={firstCheckpoint.name}
          elevationGain={startToFirstCPStats?.gain || 0}
          elevationLoss={startToFirstCPStats?.loss || 0}
        />

        <p className="text-gray-500 text-sm text-center">Chỉ có 1 checkpoint</p>

        {/* Last CP to Finish */}
        <LastCPToFinish
          distance={distanceFromLastCPToFinish}
          cpName={lastCheckpoint.name}
          elevationGain={lastCPToFinishStats?.gain || 0}
          elevationLoss={lastCPToFinishStats?.loss || 0}
        />
      </div>
    );
  }

  const totalGain = gpxData.waypointDistances.reduce((sum, wd) => sum + wd.elevationGain, 0);
  const totalLoss = gpxData.waypointDistances.reduce((sum, wd) => sum + wd.elevationLoss, 0);

  return (
    <div className="space-y-3">
      {/* Start to first CP */}
      <StartToFirstCP 
        distance={distanceToFirstCP}
        cpName={firstCheckpoint.name}
        elevationGain={startToFirstCPStats?.gain || 0}
        elevationLoss={startToFirstCPStats?.loss || 0}
      />

      {gpxData.waypointDistances.map((wd, index) => (
        <div
          key={index}
          className="bg-gray-50 rounded-lg p-3 text-sm hover:bg-blue-50 transition-colors cursor-pointer"
          onMouseEnter={() => setHoverIndex(wd.fromIndex)}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Header: CP names */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate" title={wd.from.name}>
                {wd.from.name}
              </p>
              <p className="text-xs text-gray-500">
                Km {wd.from.distanceFromStart.toFixed(1)}
              </p>
            </div>
            <div className="text-gray-400 flex-shrink-0">→</div>
            <div className="flex-1 min-w-0 text-right">
              <p className="font-medium text-gray-800 truncate" title={wd.to.name}>
                {wd.to.name}
              </p>
              <p className="text-xs text-gray-500">
                Km {wd.to.distanceFromStart.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded p-2 space-y-1">
            {/* Distance */}
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Khoảng cách:</span>
              <span className="font-semibold text-blue-600">
                {wd.distance.toFixed(2)} km
              </span>
            </div>
            
            {/* Elevation Gain */}
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Tổng leo (D+):</span>
              <span className="font-semibold text-green-600">
                +{wd.elevationGain.toFixed(0)} m
              </span>
            </div>
            
            {/* Elevation Loss */}
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Tổng xuống (D-):</span>
              <span className="font-semibold text-red-600">
                -{wd.elevationLoss.toFixed(0)} m
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Last CP to Finish */}
      <LastCPToFinish
        distance={distanceFromLastCPToFinish}
        cpName={lastCheckpoint.name}
        elevationGain={lastCPToFinishStats?.gain || 0}
        elevationLoss={lastCPToFinishStats?.loss || 0}
      />

      {/* Summary */}
      <div className="border-t pt-3 mt-3 space-y-2">
        <p className="text-sm font-medium text-gray-700">Tổng kết</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-50 rounded p-2">
            <p className="text-gray-500">Số CP</p>
            <p className="font-semibold text-blue-600">{gpxData.waypoints.length}</p>
          </div>
          <div className="bg-blue-50 rounded p-2">
            <p className="text-gray-500">Tổng km</p>
            <p className="font-semibold text-blue-600">
              {gpxData.summary.totalDistance.toFixed(2)} km
            </p>
          </div>
          <div className="bg-green-50 rounded p-2">
            <p className="text-gray-500">Tổng D+</p>
            <p className="font-semibold text-green-600">+{totalGain.toFixed(0)} m</p>
          </div>
          <div className="bg-red-50 rounded p-2">
            <p className="text-gray-500">Tổng D-</p>
            <p className="font-semibold text-red-600">-{totalLoss.toFixed(0)} m</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StartToFirstCP({ distance, cpName, elevationGain, elevationLoss }: {
  distance: number;
  cpName: string;
  elevationGain: number;
  elevationLoss: number;
}) {
  return (
    <div className="bg-green-50 rounded-lg p-3 text-sm border-l-4 border-green-500">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-green-700">Xuất phát</p>
          <p className="text-xs text-gray-500">Km 0</p>
        </div>
        <div className="text-gray-400 flex-shrink-0">→</div>
        <div className="flex-1 min-w-0 text-right">
          <p className="font-medium text-gray-800 truncate" title={cpName}>
            {cpName}
          </p>
          <p className="text-xs text-gray-500">Km {distance.toFixed(1)}</p>
        </div>
      </div>
      <div className="bg-white rounded p-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Khoảng cách:</span>
          <span className="font-semibold text-blue-600">{distance.toFixed(2)} km</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Tổng leo (D+):</span>
          <span className="font-semibold text-green-600">+{elevationGain.toFixed(0)} m</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Tổng xuống (D-):</span>
          <span className="font-semibold text-red-600">-{elevationLoss.toFixed(0)} m</span>
        </div>
      </div>
    </div>
  );
}

function LastCPToFinish({ distance, cpName, elevationGain, elevationLoss }: {
  distance: number;
  cpName: string;
  elevationGain: number;
  elevationLoss: number;
}) {
  return (
    <div className="bg-red-50 rounded-lg p-3 text-sm border-l-4 border-red-500">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 truncate" title={cpName}>
            {cpName}
          </p>
        </div>
        <div className="text-gray-400 flex-shrink-0">→</div>
        <div className="flex-1 min-w-0 text-right">
          <p className="font-medium text-red-700">Kết thúc</p>
          <p className="text-xs text-gray-500">{distance.toFixed(2)} km</p>
        </div>
      </div>
      <div className="bg-white rounded p-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Khoảng cách:</span>
          <span className="font-semibold text-blue-600">{distance.toFixed(2)} km</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Tổng leo (D+):</span>
          <span className="font-semibold text-green-600">+{elevationGain.toFixed(0)} m</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Tổng xuống (D-):</span>
          <span className="font-semibold text-red-600">-{elevationLoss.toFixed(0)} m</span>
        </div>
      </div>
    </div>
  );
}
