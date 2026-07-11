import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import AlertPanel from './AlertPanel';
import AnalyticsPanel from './AnalyticsPanel';

export default function CommandCenter() {
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [liveStreamUrl, setLiveStreamUrl] = useState("http://localhost:8000/samples/normal_traffic.mp4");
  const [autoPilotIndex, setAutoPilotIndex] = useState(-1);
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);

  const VIDEOS_PLAYLIST = [
    'normal_traffic.mp4',
    'earthquake.mp4',
    'mall_footfall.mp4',
    'car_fire.mp4'
  ];

  const injectMockAlert = (filename) => {
      let mockAlert = null;
      if (filename === 'earthquake.mp4') {
          mockAlert = {
              type: "anomaly_report",
              report: {
                  threat_detected: true,
                  incident_report: "MOCK INCIDENT: Severe seismic activity detected across Sector 7G. Magnitude estimated > 6.0 based on structural displacement and camera telemetry. Significant structural shaking observed on primary supports. Power fluctuations detected on secondary grid. Immediate risk of localized collapse or falling debris. Initiate immediate disaster protocols and mass broadcast evacuation orders to all affected zones.",
                  recommended_action: "initiate_evacuation",
                  confidence: 0.98,
                  bounding_box: [100, 100, 900, 900]
              },
              timestamp: Date.now() / 1000,
              camera_id: "CAM-02-SEISMIC",
              video: "/samples/earthquake.mp4"
          };
      } else if (filename === 'car_fire.mp4') {
          mockAlert = {
              type: "anomaly_report",
              report: {
                  threat_detected: true,
                  incident_report: "MOCK INCIDENT: Class B vehicular fire detected on Highway M-14, Northbound lanes. Intense thermal signature and dense toxic smoke plume expanding across adjacent lanes. Primary chassis heavily engulfed. High risk of secondary explosions from fuel tank ignition. Traffic obstruction critical. Immediate dispatch of specialized HazMat fire response required.",
                  recommended_action: "dispatch_fire_and_rescue",
                  confidence: 0.95,
                  bounding_box: [400, 300, 900, 800]
              },
              timestamp: Date.now() / 1000,
              camera_id: "CAM-04-HIGHWAY",
              video: "/samples/car_fire.mp4"
          };
      } else if (filename === 'normal_traffic.mp4') {
          mockAlert = {
              type: "anomaly_report",
              report: {
                  threat_detected: false,
                  incident_report: "MOCK SCAN: Routine urban traffic analysis completed. Vehicle flow normal. No anomalous behavior or collision trajectories detected.",
                  recommended_action: "None",
                  confidence: 0.99,
                  bounding_box: []
              },
              timestamp: Date.now() / 1000,
              camera_id: "CAM-01-URBAN",
              video: "/samples/normal_traffic.mp4"
          };
      } else if (filename === 'mall_footfall.mp4') {
          mockAlert = {
              type: "anomaly_report",
              report: {
                  threat_detected: false,
                  incident_report: "MOCK SCAN: Pedestrian foot traffic analysis completed. Density within nominal limits. No aggressive behavior or restricted items detected.",
                  recommended_action: "None",
                  confidence: 0.97,
                  bounding_box: []
              },
              timestamp: Date.now() / 1000,
              camera_id: "CAM-03-FOOT-TRAFFIC",
              video: "/samples/mall_footfall.mp4"
          };
      }
      if (mockAlert) setAlerts(prev => [mockAlert, ...prev]);
  };

  useEffect(() => {
    if (autoPilotIndex >= 0) {
      switchStream(VIDEOS_PLAYLIST[autoPilotIndex]);
      
      let mockTimeout = null;
      if (isMockMode) {
          const currentVideo = VIDEOS_PLAYLIST[autoPilotIndex];
          // Simulate 5 seconds VLM processing delay before injecting alert
          mockTimeout = setTimeout(() => injectMockAlert(currentVideo), 5000);
      }

      const timer = setTimeout(() => {
        setAutoPilotIndex((prev) => (prev + 1) % VIDEOS_PLAYLIST.length);
      }, 25000); // Cycle every 25 seconds
      
      return () => {
          clearTimeout(timer);
          if (mockTimeout) clearTimeout(mockTimeout);
      };
    }
  }, [autoPilotIndex, isMockMode]);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket("ws://localhost:8000/ws");
    
    ws.onopen = () => {
      console.log("Connected to Ocular Sentinel Backend");
      setIsConnected(true);
      setIsMockMode(false);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "anomaly_report") {
        setAlerts((prevAlerts) => [data, ...prevAlerts]);
      }
    };

    const triggerMockFallback = () => {
        console.warn("WebSocket unavailable. Activating MOCK MODE.");
        setIsMockMode(true);
        setIsConnected(true); // Fake connection for UI
        
        // Ensure the initial video loads correctly in mock mode
        setLiveStreamUrl(prev => prev.includes("localhost:8000") ? "/samples/normal_traffic.mp4" : prev);
        
        // Auto-start mock loop if not already started
        setAutoPilotIndex(prev => prev === -1 ? 0 : prev);
    };

    ws.onerror = triggerMockFallback;
    ws.onclose = triggerMockFallback;

    return () => ws.close();
  }, []);

  const handleManualTrigger = async (filename) => {
    // Switch the stream first
    switchStream(filename, { type: 'click' });
    
    if (isMockMode) {
        setTimeout(() => injectMockAlert(filename), 3000); // Trigger mock alert faster on manual click
    } else {
        // Wait for OpenCV to initialize the new stream
        setTimeout(async () => {
            try {
              await fetch("http://localhost:8000/api/trigger", { method: "POST" });
            } catch (e) {
              console.error("Failed to trigger manually", e);
            }
        }, 1000);
    }
    
    setShowOverrideMenu(false);
  };

  const switchStream = async (filename, event = null) => {
    // If user clicks a manual button, stop autopilot
    if (autoPilotIndex !== -1 && event && event.type === 'click') {
        setAutoPilotIndex(-1); // Stop autopilot on manual override
    }

    if (isMockMode) {
        setLiveStreamUrl(`/samples/${filename}`);
        return;
    }

    const backendPath = `samples/${filename}`;
    const frontendUrl = `http://localhost:8000/${backendPath}`;
    
    try {
      await fetch(`http://localhost:8000/api/set_stream?url=${encodeURIComponent(backendPath)}`, { method: "POST" });
      setLiveStreamUrl(frontendUrl);
    } catch (e) {
      console.error("Failed to switch stream, enabling Mock Mode", e);
      setIsMockMode(true);
      setLiveStreamUrl(`/samples/${filename}`);
    }
  };

  return (
    <div className="min-h-screen bg-ocular-dark text-white p-6 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wider text-ocular-cyan flex items-center gap-3">
            <div className="w-4 h-4 bg-ocular-cyan rounded-full animate-pulse"></div>
            OCULAR SENTINEL
          </h1>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest">Autonomous C4ISR Early-Warning System</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
             <span className="text-sm text-gray-400">{isConnected ? 'UPLINK ACTIVE' : 'UPLINK OFFLINE'}</span>
          </div>
          <div className="flex gap-2 ml-4 border-l border-gray-700 pl-4">
            <div className="flex gap-2">
              <button 
                onClick={() => autoPilotIndex >= 0 ? setAutoPilotIndex(-1) : setAutoPilotIndex(0)}
                className={`px-4 py-2 hover:bg-gray-700 border rounded text-sm transition-colors font-bold ${autoPilotIndex >= 0 ? 'bg-ocular-cyan text-black border-ocular-cyan animate-pulse' : 'bg-ocular-panel border-gray-600'}`}
              >
                {autoPilotIndex >= 0 ? 'AUTO-PILOT ACTIVE' : 'START AUTO-PILOT'}
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowOverrideMenu(!showOverrideMenu)}
                  className="px-4 py-2 bg-ocular-panel hover:bg-gray-700 border border-gray-600 rounded text-sm transition-colors font-bold flex items-center gap-2"
                >
                  MANUAL OVERRIDE <span className="text-[10px]">▼</span>
                </button>
                
                {showOverrideMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded shadow-2xl z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-800 text-[10px] text-gray-500 font-mono">SELECT TARGET</div>
                  <button onClick={() => handleManualTrigger('normal_traffic.mp4')} className="block w-full text-left px-4 py-3 hover:bg-gray-800 text-xs transition-colors border-b border-gray-800">CAM 01 (URBAN TRAFFIC)</button>
                  <button onClick={() => handleManualTrigger('earthquake.mp4')} className="block w-full text-left px-4 py-3 hover:bg-ocular-crimson/20 text-red-200 text-xs transition-colors border-b border-gray-800">CAM 02 (SEISMIC ANOMALY)</button>
                  <button onClick={() => handleManualTrigger('mall_footfall.mp4')} className="block w-full text-left px-4 py-3 hover:bg-gray-800 text-xs transition-colors border-b border-gray-800">CAM 03 (FOOT TRAFFIC)</button>
                  <button onClick={() => handleManualTrigger('car_fire.mp4')} className="block w-full text-left px-4 py-3 hover:bg-ocular-crimson/20 text-red-200 text-xs transition-colors">CAM 04 (VEHICLE FIRE)</button>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-ocular-panel border border-gray-700 rounded-lg p-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ocular-cyan to-transparent"></div>
            <h2 className="text-lg text-gray-300 mb-4 tracking-wider flex items-center justify-between">
              <span>LIVE FEED: SECTOR 7G {isMockMode && <span className="text-yellow-500 text-xs ml-2">(MOCK MODE)</span>}</span>
              <span className="text-xs text-ocular-cyan bg-ocular-dark px-2 py-1 rounded">TRIPWIRE ACTIVE</span>
            </h2>
            <div className="aspect-video bg-black rounded overflow-hidden relative">
              <VideoPlayer streamUrl={liveStreamUrl} isConnected={isConnected} isMockMode={isMockMode} latestAlert={alerts.length > 0 ? alerts[0] : null} />
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-gray-400">
              <div className="bg-ocular-dark p-2 rounded border border-gray-800">
                <span className="block text-gray-500 mb-1">LOCAL COMPUTE</span>
                <span className="text-ocular-cyan font-mono">{isMockMode ? 'MOCK EDGE NODE' : 'AMD RYZEN AI (SIMULATED)'}</span>
              </div>
              <div className="bg-ocular-dark p-2 rounded border border-gray-800">
                <span className="block text-gray-500 mb-1">CLOUD VLM</span>
                <span className="text-ocular-cyan font-mono">{isMockMode ? 'MOCK VLM SERVER' : 'QWEN-VL (AMD NOTEBOOK)'}</span>
              </div>
              <div className="bg-ocular-dark p-2 rounded border border-gray-800">
                <span className="block text-gray-500 mb-1">VLM ACCELERATION</span>
                <span className="text-ocular-cyan font-mono">AMD MI300X (SIMULATED)</span>
              </div>
            </div>
          </div>
          
          <AnalyticsPanel isConnected={isConnected} />
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <AlertPanel alerts={alerts} />
          
          {alerts.length > 0 && alerts[0]?.report?.recommended_action && alerts[0].report.recommended_action !== "None" && (
            <div className="bg-red-900/30 border border-red-500 rounded p-4 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-[pulse_2s_ease-in-out_infinite]">
              <h3 className="text-red-400 font-bold mb-2 font-mono flex items-center gap-2 text-sm tracking-wider">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                AUTONOMOUS AGENT ESCALATION
              </h3>
              <p className="text-white text-sm font-mono mt-3">
                [SYSTEM ACTION]: <span className="text-red-300">{alerts[0].report.recommended_action.toUpperCase()}</span> INITIATED FOR SECTOR 7G.
              </p>
            </div>
          )}

          <div className="bg-ocular-panel border border-gray-700 rounded p-4 shadow-xl">
             <h3 className="text-ocular-cyan text-sm tracking-widest mb-3 flex items-center gap-2">
               TACTICAL VQA CHAT
             </h3>
             <div className="flex gap-2">
                <input type="text" placeholder="Query AMD VLM..." className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-ocular-cyan" />
                <button className="bg-gray-800 hover:bg-ocular-cyan hover:text-black px-4 py-2 rounded text-sm font-bold text-ocular-cyan border border-gray-600 transition-colors">SEND</button>
             </div>
             <p className="text-[10px] text-gray-500 mt-3 font-mono">Powered by Qwen-VL-Chat on AMD ROCm</p>
          </div>
        </div>
      </main>
    </div>
  );
}
