import React from 'react';

export default function AlertPanel({ alerts }) {
  return (
    <div className="bg-ocular-panel border border-gray-700 rounded-lg shadow-2xl h-[calc(100vh-8rem)] flex flex-col">
      <div className="p-4 border-b border-gray-700 bg-gray-800/50">
        <h2 className="text-lg tracking-wider text-gray-300 flex items-center justify-between">
          <span>INTELLIGENCE LOG</span>
          <span className="bg-ocular-dark text-xs px-2 py-1 rounded text-gray-400">
            {alerts.length} EVENTS
          </span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {alerts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-600 text-sm">
            NO ANOMALIES DETECTED
          </div>
        ) : (
          alerts.map((alert, index) => {
            const isThreat = alert.report?.threat_detected;
            const confidenceStr = alert.report?.confidence 
              ? (alert.report.confidence * 100).toFixed(1) + "%" 
              : "N/A";
              
            return (
              <div 
                key={index} 
                className={`border rounded-lg p-3 ${isThreat ? 'border-ocular-crimson/50 bg-red-950/20' : 'border-gray-700 bg-ocular-dark'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`text-xs font-bold px-2 py-1 rounded ${isThreat ? 'bg-ocular-crimson text-white' : 'bg-gray-700 text-gray-300'}`}>
                    {isThreat ? 'THREAT CONFIRMED' : 'FALSE ALARM / ALL CLEAR'}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {new Date(alert.timestamp * 1000).toLocaleTimeString()}
                  </div>
                </div>
                
                {alert.video ? (
                  <div className="my-3 rounded overflow-hidden border border-gray-700 bg-black">
                    <video src={alert.video} autoPlay loop muted controls className="w-full h-auto" />
                  </div>
                ) : alert.image ? (
                  <div className="my-3 rounded overflow-hidden border border-gray-700 bg-black">
                    <img src={alert.image} alt="Trigger Frame" className="w-full h-auto" />
                  </div>
                ) : null}
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-gray-700/50 pb-1">
                    <span className="text-gray-500">TYPE</span>
                    <span className="text-gray-300 uppercase">{alert.report?.threat_detected ? 'CONFIRMED ANOMALY' : 'NONE'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700/50 pb-1">
                    <span className="text-gray-500">CONFIDENCE</span>
                    <span className="text-ocular-cyan font-mono">{confidenceStr}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-gray-500 text-xs block mb-1">INCIDENT REPORT</span>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {alert.report?.incident_report || 'No report generated.'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
