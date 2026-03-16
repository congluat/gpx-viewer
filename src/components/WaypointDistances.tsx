import { useGPX } from '../context/GPXContext';

export default function WaypointDistances() {
  const { gpxData, setHoverIndex } = useGPX();

  if (!gpxData || gpxData.waypoints.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        Không có checkpoint/waypoint trong file GPX
      </div>
    );
  }

  if (gpxData.waypointDistances.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-gray-500 text-sm">Chỉ có 1 checkpoint:</p>
        <div className="bg-blue-50 p-2 rounded text-sm">
          <p className="font-medium">{gpxData.waypoints[0].name}</p>
          <p className="text-gray-600">
            Km {gpxData.waypoints[0].distanceFromStart.toFixed(2)} • 
            {gpxData.waypoints[0].elevation.toFixed(0)}m
          </p>
        </div>
      </div>
    );
  }

  const totalGain = gpxData.waypointDistances.reduce((sum, wd) => sum + wd.elevationGain, 0);
  const totalLoss = gpxData.waypointDistances.reduce((sum, wd) => sum + wd.elevationLoss, 0);

  return (
    <div className="space-y-3">
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

            {/* Net change */}
            <div className="flex justify-between text-xs border-t pt-1 mt-1">
              <span className="text-gray-500">Chênh lệch ròng:</span>
              <span
                className={`font-semibold ${
                  wd.elevationChange > 0
                    ? 'text-green-600'
                    : wd.elevationChange < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {wd.elevationChange > 0 ? '+' : ''}
                {wd.elevationChange.toFixed(0)} m
              </span>
            </div>
          </div>
        </div>
      ))}

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
