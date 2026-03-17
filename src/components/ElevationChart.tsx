import { useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useGPX } from '../context/GPXContext';
import { getSlopeColor } from '../utils/slopeDetector';

interface ChartDataPoint {
  distance: number;
  elevation: number;
  grade: number;
}

interface ElevationChartProps {
  compact?: boolean;
}

interface GradientStop {
  offset: string;
  color: string;
}

export default function ElevationChart({ compact = false }: ElevationChartProps) {
  const { gpxData, hoverPoint, setHoverDistance } = useGPX();

  const chartData = useMemo((): ChartDataPoint[] => {
    if (!gpxData) return [];

    // Sample data if too many points (for performance)
    const maxPoints = 500;
    const step = Math.max(1, Math.floor(gpxData.trackPoints.length / maxPoints));

    return gpxData.trackPoints
      .filter((_, index) => index % step === 0)
      .map((point) => ({
        distance: point.distance,
        elevation: point.elevation,
        grade: point.grade,
      }));
  }, [gpxData]);

  const gradientStops = useMemo((): GradientStop[] => {
    if (chartData.length === 0) return [];

    const totalDistance = chartData[chartData.length - 1].distance;
    if (totalDistance === 0) return [];

    return chartData.map((point) => ({
      offset: `${(point.distance / totalDistance) * 100}%`,
      color: getSlopeColor(point.grade),
    }));
  }, [chartData]);

  const handleMouseMove = useCallback(
    (state: { activePayload?: Array<{ payload: ChartDataPoint }> }) => {
      if (state.activePayload && state.activePayload.length > 0) {
        setHoverDistance(state.activePayload[0].payload.distance);
      }
    },
    [setHoverDistance]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverDistance(null);
  }, [setHoverDistance]);

  if (!gpxData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p className={compact ? 'text-xs' : ''}>
          {compact ? 'Chọn cự ly để xem' : 'Tải file GPX để xem biểu đồ độ cao'}
        </p>
      </div>
    );
  }

  const minElevation = Math.floor(gpxData.summary.minElevation / 100) * 100;
  const maxElevation = Math.ceil(gpxData.summary.maxElevation / 100) * 100;

  if (compact) {
    return (
      <div className="h-full p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="slopeGradientCompact" x1="0" y1="0" x2="1" y2="0">
                {gradientStops.map((stop, index) => (
                  <stop
                    key={index}
                    offset={stop.offset}
                    stopColor={stop.color}
                    stopOpacity={1}
                  />
                ))}
              </linearGradient>
              <linearGradient id="slopeStrokeCompact" x1="0" y1="0" x2="1" y2="0">
                {gradientStops.map((stop, index) => (
                  <stop
                    key={index}
                    offset={stop.offset}
                    stopColor={stop.color}
                    stopOpacity={1}
                  />
                ))}
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="distance" 
              tick={{ fontSize: 10 }}
              tickFormatter={(value: number) => `${value.toFixed(0)}`}
              stroke="#9ca3af"
            />
            <YAxis 
              domain={[minElevation, maxElevation]} 
              tick={{ fontSize: 10 }}
              stroke="#9ca3af"
              width={35}
            />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke="url(#slopeStrokeCompact)"
              strokeWidth={2}
              fill="url(#slopeGradientCompact)"
              isAnimationActive={false}
            />
            {hoverPoint && (
              <ReferenceLine
                x={hoverPoint.distance}
                stroke="#000"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-full p-2 sm:p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="slopeGradient" x1="0" y1="0" x2="1" y2="0">
              {gradientStops.map((stop, index) => (
                <stop
                  key={index}
                  offset={stop.offset}
                  stopColor={stop.color}
                  stopOpacity={1}
                />
              ))}
            </linearGradient>
            <linearGradient id="slopeStroke" x1="0" y1="0" x2="1" y2="0">
              {gradientStops.map((stop, index) => (
                <stop
                  key={index}
                  offset={stop.offset}
                  stopColor={stop.color}
                  stopOpacity={1}
                />
              ))}
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="distance"
            tickFormatter={(value: number) => `${value.toFixed(0)}`}
            stroke="#6b7280"
            fontSize={10}
          />
          <YAxis
            domain={[minElevation, maxElevation]}
            tickFormatter={(value: number) => `${value}`}
            stroke="#6b7280"
            fontSize={10}
            width={45}
            tickCount={5}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0) {
                const data = payload[0].payload as ChartDataPoint;
                return (
                  <div className="bg-white p-2 sm:p-3 rounded-lg shadow-lg border border-gray-200 text-xs sm:text-sm">
                    <p>
                      <span className="font-medium">Km:</span>{' '}
                      {data.distance.toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">Cao:</span>{' '}
                      {data.elevation.toFixed(0)}m
                    </p>
                    <p>
                      <span className="font-medium">Dốc:</span>{' '}
                      <span style={{ color: getSlopeColor(data.grade) }}>
                        {data.grade.toFixed(1)}%
                      </span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="elevation"
            stroke="url(#slopeStroke)"
            strokeWidth={2}
            fill="url(#slopeGradient)"
            isAnimationActive={false}
          />
          {hoverPoint && (
            <ReferenceLine
              x={hoverPoint.distance}
              stroke="#000"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
