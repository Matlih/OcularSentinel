import React, { useState, useEffect } from 'react';
import EvilEye from './EvilEye';

export default function EntryScreen({ onProceed }) {
  const [booting, setBooting] = useState(false);
  const [flameSpeed, setFlameSpeed] = useState(0.8);
  const [glowIntensity, setGlowIntensity] = useState(0.6);

  const handleProceed = () => {
    setBooting(true);
    
    // Animate the eye properties over 2.5 seconds
    const duration = 2500;
    const steps = 50;
    const interval = duration / steps;
    let currentStep = 0;

    const animTimer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      // Easing function for dramatic effect
      const easeInQuad = progress * progress;
      
      setFlameSpeed(0.8 + (easeInQuad * 3.0));
      setGlowIntensity(0.6 + (easeInQuad * 1.5));

      if (currentStep >= steps) {
        clearInterval(animTimer);
        onProceed();
      }
    }, interval);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 overflow-hidden">
      <div className="absolute inset-0 opacity-80 -top-24">
        <EvilEye 
          eyeColor="#06b6d4" 
          intensity={1.5}
          pupilSize={0.5}
          irisWidth={0.25}
          glowIntensity={glowIntensity}
          scale={0.55}
          noiseScale={1.2}
          pupilFollow={booting ? 0.0 : 1.0}
          flameSpeed={flameSpeed}
          backgroundColor="#000000"
        />
      </div>
      
      <div className={`z-10 absolute bottom-24 flex flex-col items-center transition-opacity duration-1000 ${booting ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="text-4xl font-bold tracking-[0.3em] text-ocular-cyan mb-2">OCULAR SENTINEL</h1>
        <p className="text-gray-400 text-xs tracking-widest font-mono mb-8">AUTONOMOUS C4ISR EARLY-WARNING SYSTEM</p>
        
        <button 
          onClick={handleProceed}
          disabled={booting}
          className="relative group px-8 py-3 border border-ocular-cyan text-ocular-cyan font-bold tracking-widest text-sm hover:bg-ocular-cyan hover:text-black transition-all duration-300"
        >
          <div className="absolute inset-0 bg-ocular-cyan/20 blur-md group-hover:bg-ocular-cyan/40 transition-all duration-300"></div>
          <span className="relative z-10 flex items-center gap-2">
            [ INITIALIZE SENTINEL ]
          </span>
        </button>
      </div>

    </div>
  );
}
