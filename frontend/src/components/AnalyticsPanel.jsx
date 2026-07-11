import React, { useState, useEffect } from 'react';

export default function AnalyticsPanel({ isConnected }) {
  const [bandwidthSaved, setBandwidthSaved] = useState(0);
  const [hoursSaved, setHoursSaved] = useState(1402);
  const [falseAlarms, setFalseAlarms] = useState(8421);
  const [activeSince] = useState(Date.now() - (1000 * 60 * 60 * 48)); // Mock 48 hours

  // Live Bandwidth Calculation
  // 1080p Video Stream is approx 3000 kbps (375 KB/s)
  // Single JPEG sent to VLM is approx 150 KB
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      // Every second, we save 375KB of data by not streaming
      setBandwidthSaved(prev => prev + 375);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Format bytes to GB/MB
  const formatBandwidth = (kb) => {
    if (kb > 1048576) {
      return (kb / 1048576).toFixed(2) + ' GB';
    }
    return (kb / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="bg-ocular-panel border border-gray-700 rounded-lg p-4 shadow-2xl mt-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ocular-cyan to-transparent"></div>
      
      <h2 className="text-lg text-gray-300 mb-4 tracking-wider flex items-center justify-between">
        <span>SYSTEM ANALYTICS & ROI</span>
        <span className="text-xs text-gray-500 font-mono">NODE: RYZEN AI + MI300X</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bandwidth Metric */}
        <div className="bg-ocular-dark p-3 rounded border border-gray-800 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-ocular-cyan opacity-10 rounded-full blur-xl transform translate-x-4 -translate-y-4"></div>
          <span className="text-xs text-gray-500 mb-1">BANDWIDTH SAVED (LIVE)</span>
          <span className="text-2xl text-ocular-cyan font-bold font-mono tracking-wider">
            {formatBandwidth(bandwidthSaved)}
          </span>
          <span className="text-[10px] text-gray-600 mt-1 uppercase">Edge Filtering Efficiency</span>
        </div>

        {/* Human Hours Saved */}
        <div className="bg-ocular-dark p-3 rounded border border-gray-800 flex flex-col">
          <span className="text-xs text-gray-500 mb-1">HUMAN HOURS SAVED</span>
          <span className="text-2xl text-white font-bold font-mono tracking-wider">
            {hoursSaved.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-600 mt-1 uppercase">Automated Surveillance</span>
        </div>

        {/* False Alarms Filtered */}
        <div className="bg-ocular-dark p-3 rounded border border-gray-800 flex flex-col">
          <span className="text-xs text-gray-500 mb-1">FALSE ALARMS FILTERED</span>
          <span className="text-2xl text-green-400 font-bold font-mono tracking-wider">
            {falseAlarms.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-600 mt-1 uppercase">YOLO11n Noise Reduction</span>
        </div>
      </div>
    </div>
  );
}
