import React, { useState, useEffect } from 'react';
import EvilEye from './EvilEye';

const VIDEOS = [
  'http://localhost:8000/samples/normal_traffic.mp4',
  'http://localhost:8000/samples/massive_flock_birds.mp4',
  'http://localhost:8000/samples/fire_room.mp4',
  'http://localhost:8000/samples/road_collision.mp4'
];

export default function VideoPlayer({ streamUrl, isConnected, latestAlert }) {
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => {
    if (latestAlert && latestAlert.report && latestAlert.report.threat_detected) {
      setExpanded(true);
      // Auto-collapse after 10 seconds of no new alerts
      const timer = setTimeout(() => setExpanded(false), 10000);
      return () => clearTimeout(timer);
    } else {
      setExpanded(false);
    }
  }, [latestAlert]);

  // Extract bounding box if expanded and threat detected
  let bbox = null;
  if (expanded && latestAlert?.report?.bounding_box && latestAlert.report.bounding_box.length === 4) {
      // bbox is [y1, x1, y2, x2] normalized 0-1000
      const [y1, x1, y2, x2] = latestAlert.report.bounding_box;
      if (y2 > y1 && x2 > x1) {
          bbox = {
              top: `${(y1 / 1000) * 100}%`,
              left: `${(x1 / 1000) * 100}%`,
              height: `${((y2 - y1) / 1000) * 100}%`,
              width: `${((x2 - x1) / 1000) * 100}%`
          };
      }
  }

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
        {isConnected ? 'LIVE' : 'STANDBY'}
      </div>
      
      {isConnected ? (
        <div className="w-full h-full relative">
          {/* 2x2 Grid */}
          <div className={`w-full h-full grid grid-cols-2 grid-rows-2 transition-all duration-700 ease-in-out ${expanded ? 'opacity-0 scale-150 pointer-events-none' : 'opacity-100 scale-100'}`}>
            {VIDEOS.map((vid, idx) => (
              <div key={idx} className={`relative border border-gray-800 ${vid === streamUrl ? 'ring-2 ring-ocular-cyan ring-inset' : ''}`}>
                <video src={vid} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 text-[10px] text-gray-400 font-mono">
                  CAM 0{idx + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Expanded Video Overlay */}
          <div className={`absolute inset-0 transition-all duration-700 ease-in-out origin-center ${expanded ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-50 pointer-events-none'}`}>
            <video key={streamUrl} src={streamUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            
            {/* Bounding Box */}
            {bbox && (
              <div 
                className="absolute border-2 border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-300 pointer-events-none"
                style={bbox}
              >
                <div className="absolute -top-6 left-0 bg-red-500 text-white text-[10px] px-1 font-bold whitespace-nowrap">
                  TARGET LOCK
                </div>
              </div>
            )}
            
            {/* Decorative scanning line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 animate-[scan_3s_ease-in-out_infinite] pointer-events-none" 
                 style={{ boxShadow: '0 0 10px 2px rgba(239, 68, 68, 0.5)' }}></div>
            <style>{`
              @keyframes scan {
                0% { top: 0; }
                50% { top: 100%; }
                100% { top: 0; }
              }
            `}</style>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 opacity-90">
          <EvilEye 
            eyeColor="#06b6d4" 
            intensity={1.5}
            pupilSize={0.5}
            irisWidth={0.25}
            glowIntensity={0.5}
            scale={0.8}
            noiseScale={1.2}
            pupilFollow={1.0}
            flameSpeed={0.8}
            backgroundColor="#000000"
          />
        </div>
      )}
    </div>
  );
}
