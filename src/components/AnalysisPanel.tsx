import { useState } from 'react';
import { useGPX } from '../context/GPXContext';
import SlopeTable from './SlopeTable';
import WaypointDistances from './WaypointDistances';

type Tab = 'summary' | 'slopes' | 'waypoints';

export default function AnalysisPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const { gpxData, currentGpxUrl } = useGPX();

  if (!gpxData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">📊</div>
          <p>Tải file GPX để xem phân tích</p>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    if (!currentGpxUrl) return;
    
    const link = document.createElement('a');
    link.href = currentGpxUrl;
    link.download = currentGpxUrl.split('/').pop() || 'track.gpx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'summary', label: 'Tổng quan' },
    { id: 'slopes', label: 'Độ dốc' },
    { id: 'waypoints', label: 'Checkpoints' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Track Name & Download */}
      <div className="px-3 sm:px-4 py-3 border-b bg-gray-50 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-800 truncate flex-1 text-sm sm:text-base" title={gpxData.name}>
          {gpxData.name}
        </h2>
        {currentGpxUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-2 text-xs text-blue-600 hover:text-blue-800 
                       hover:bg-blue-50 rounded-lg transition-colors active:bg-blue-100"
            title="Tải file GPX"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="hidden sm:inline">Tải GPX</span>
            <span className="sm:hidden">GPX</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors
              ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 active:bg-gray-100'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {activeTab === 'summary' && <SummaryTab />}
        {activeTab === 'slopes' && <SlopeTable />}
        {activeTab === 'waypoints' && <WaypointDistances />}
      </div>
    </div>
  );
}

function SummaryTab() {
  const { gpxData } = useGPX();

  if (!gpxData) return null;

  const { summary, slopeSegments } = gpxData;
  const uphillCount = slopeSegments.filter((s) => s.type === 'uphill').length;
  const downhillCount = slopeSegments.filter((s) => s.type === 'downhill').length;

  return (
    <div className="space-y-4">
      {/* Key Stats Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 mb-1">Tổng quãng đường</p>
          <p className="text-lg sm:text-xl font-bold text-blue-700">
            {summary.totalDistance.toFixed(2)} <span className="text-sm font-normal">km</span>
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600 mb-1">Tổng leo (D+)</p>
          <p className="text-lg sm:text-xl font-bold text-green-700">
            +{summary.totalElevationGain.toFixed(0)} <span className="text-sm font-normal">m</span>
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <p className="text-xs text-red-600 mb-1">Tổng xuống (D-)</p>
          <p className="text-lg sm:text-xl font-bold text-red-700">
            -{summary.totalElevationLoss.toFixed(0)} <span className="text-sm font-normal">m</span>
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-600 mb-1">Cao nhất</p>
          <p className="text-lg sm:text-xl font-bold text-purple-700">
            {summary.maxElevation.toFixed(0)} <span className="text-sm font-normal">m</span>
          </p>
        </div>
      </div>

      {/* Detail Stats */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Độ cao thấp nhất</span>
          <span className="font-medium">{summary.minElevation.toFixed(0)} m</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Độ cao bắt đầu</span>
          <span className="font-medium">{summary.startElevation.toFixed(0)} m</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Độ cao kết thúc</span>
          <span className="font-medium">{summary.endElevation.toFixed(0)} m</span>
        </div>
        <div className="border-t pt-2 mt-2 flex justify-between text-sm">
          <span className="text-gray-600">Số đoạn dốc</span>
          <span className="font-medium">
            <span className="text-green-600">{uphillCount} lên</span>
            {' / '}
            <span className="text-red-600">{downhillCount} xuống</span>
          </span>
        </div>
      </div>

      {/* Elevation Range Bar */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Biên độ độ cao</p>
        <div className="relative h-10 bg-gradient-to-t from-green-200 to-blue-200 rounded-lg overflow-hidden">
          <div
            className="absolute left-0 right-0 h-1 bg-blue-600"
            style={{
              bottom: `${
                ((summary.startElevation - summary.minElevation) /
                  (summary.maxElevation - summary.minElevation || 1)) *
                100
              }%`,
            }}
          />
          <div className="absolute bottom-1 left-2 text-xs text-gray-700 font-medium">
            {summary.minElevation.toFixed(0)}m
          </div>
          <div className="absolute top-1 right-2 text-xs text-gray-700 font-medium">
            {summary.maxElevation.toFixed(0)}m
          </div>
        </div>
      </div>
    </div>
  );
}
