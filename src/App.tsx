import { useState } from 'react'
import { GPXProvider } from './context/GPXContext'
import RaceSidebar from './components/RaceSidebar'
import MapView from './components/MapView'
import ElevationChart from './components/ElevationChart'
import AnalysisPanel from './components/AnalysisPanel'
import MobileNav from './components/MobileNav'

type MobileTab = 'map' | 'chart' | 'analysis';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('map');

  return (
    <GPXProvider>
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen bg-gray-100">
        {/* Race Sidebar */}
        <div className="w-64 flex-shrink-0">
          <RaceSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm px-4 py-1.5 flex items-center">
            <h1 className="text-sm font-semibold text-gray-600">GPX Viewer</h1>
          </header>

          {/* Map and Analysis */}
          <main className="flex-1 flex overflow-hidden">
            {/* Map Section */}
            <div className="flex-1 relative">
              <MapView />
            </div>

            {/* Analysis Panel */}
            <div className="w-80 bg-white shadow-lg overflow-y-auto">
              <AnalysisPanel />
            </div>
          </main>

          {/* Elevation Chart */}
          <div className="h-48 bg-white border-t border-gray-200">
            <ElevationChart />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col bg-gray-100" style={{ height: '100dvh' }}>
        {/* Mobile Header */}
        <header className="bg-white shadow-sm px-3 py-1 flex items-center justify-between flex-shrink-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-semibold text-gray-600">GPX Viewer</h1>
          <div className="w-8" />
        </header>

        {/* Mobile Top Navigation */}
        <MobileNav activeTab={mobileTab} onTabChange={setMobileTab} />

        {/* Mobile Content */}
        <main className="flex-1 overflow-hidden relative">
          {/* Map View */}
          <div className={`absolute inset-0 ${mobileTab === 'map' ? 'z-10' : 'z-0 pointer-events-none'}`}>
            <MapView />
          </div>

          {/* Elevation Chart - Overlay on map when selected */}
          {mobileTab === 'chart' && (
            <div className="absolute inset-0 z-10 bg-white p-2">
              <div className="w-full h-full">
                <ElevationChart />
              </div>
            </div>
          )}

          {/* Analysis Panel */}
          {mobileTab === 'analysis' && (
            <div className="absolute inset-0 z-10 bg-white overflow-y-auto">
              <AnalysisPanel />
            </div>
          )}

          {/* Mini Elevation Chart overlay on map */}
          {mobileTab === 'map' && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur border-t z-10">
              <ElevationChart compact />
            </div>
          )}
        </main>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 z-50 animate-slide-in">
              <RaceSidebar onSelect={() => setSidebarOpen(false)} />
            </div>
          </>
        )}
      </div>
    </GPXProvider>
  )
}

export default App
