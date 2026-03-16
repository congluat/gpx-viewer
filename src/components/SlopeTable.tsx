import { useGPX } from '../context/GPXContext';
import { getSlopeColor, getSlopeDifficulty } from '../utils/slopeDetector';

export default function SlopeTable() {
  const { gpxData, setHoverIndex } = useGPX();

  if (!gpxData || gpxData.slopeSegments.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        Không có đoạn dốc đáng kể
      </div>
    );
  }

  const uphillSegments = gpxData.slopeSegments.filter((s) => s.type === 'uphill');
  const downhillSegments = gpxData.slopeSegments.filter((s) => s.type === 'downhill');

  return (
    <div className="space-y-4">
      {/* Uphill Segments */}
      {uphillSegments.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-lg">⬆️</span>
            Đoạn lên dốc ({uphillSegments.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-2 py-1.5 font-medium text-gray-600">#</th>
                  <th className="px-2 py-1.5 font-medium text-gray-600">Km</th>
                  <th className="px-2 py-1.5 font-medium text-gray-600">Dài</th>
                  <th className="px-2 py-1.5 font-medium text-gray-600">Cao</th>
                  <th className="px-2 py-1.5 font-medium text-gray-600">Dốc</th>
                </tr>
              </thead>
              <tbody>
                {uphillSegments.map((segment, index) => (
                  <tr
                    key={segment.id}
                    className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                    onMouseEnter={() => setHoverIndex(segment.startIndex)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <td className="px-2 py-1.5">{index + 1}</td>
                    <td className="px-2 py-1.5 text-gray-600">
                      {segment.startDistance.toFixed(1)}-{segment.endDistance.toFixed(1)}
                    </td>
                    <td className="px-2 py-1.5">
                      {(segment.length * 1000).toFixed(0)}m
                    </td>
                    <td className="px-2 py-1.5 text-green-600">
                      +{segment.elevationGain.toFixed(0)}m
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className="px-1.5 py-0.5 rounded text-white text-xs font-medium"
                        style={{ backgroundColor: getSlopeColor(segment.averageGrade) }}
                        title={getSlopeDifficulty(segment.averageGrade)}
                      >
                        {segment.averageGrade.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Downhill Segments */}
      {downhillSegments.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-lg">⬇️</span>
            Đoạn xuống dốc ({downhillSegments.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-2 py-1.5 font-medium text-gray-600">#</th>
                  <th className="px-2 py-1.5 font-medium text-gray-600">Km</th>
                  <th className="px-2 py-1.5 font-medium text-gray-600">Dài</th>
                  <th className="px-2 py-1.5 font-medium text-gray-600">Hạ</th>
                  <th className="px-2 py-1.5 font-medium text-gray-600">Dốc</th>
                </tr>
              </thead>
              <tbody>
                {downhillSegments.map((segment, index) => (
                  <tr
                    key={segment.id}
                    className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                    onMouseEnter={() => setHoverIndex(segment.startIndex)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <td className="px-2 py-1.5">{index + 1}</td>
                    <td className="px-2 py-1.5 text-gray-600">
                      {segment.startDistance.toFixed(1)}-{segment.endDistance.toFixed(1)}
                    </td>
                    <td className="px-2 py-1.5">
                      {(segment.length * 1000).toFixed(0)}m
                    </td>
                    <td className="px-2 py-1.5 text-red-600">
                      {segment.elevationGain.toFixed(0)}m
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className="px-1.5 py-0.5 rounded text-white text-xs font-medium"
                        style={{ backgroundColor: getSlopeColor(segment.averageGrade) }}
                        title={getSlopeDifficulty(segment.averageGrade)}
                      >
                        {Math.abs(segment.averageGrade).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
