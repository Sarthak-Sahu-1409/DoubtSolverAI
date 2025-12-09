import React from 'react';
import { Sparkles, Brain, ScanLine } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fadeIn">
      {/* Orb Animation */}
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-2xl animate-pulse"></div>
        <div className="absolute inset-0 rounded-full bg-purple-600/20 blur-xl animate-ping" style={{ animationDuration: '3s' }}></div>
        <div className="absolute inset-2 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center bg-black/40 shadow-2xl">
           <Brain className="w-12 h-12 text-blue-400 animate-pulse" />
        </div>
        {/* Scanning Line */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
           <div className="w-full h-1 bg-blue-400/50 absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
        Analysing Problem
      </h2>
      <p className="text-blue-200/60 mb-8 max-w-sm mx-auto">
        Identifying key concepts, checking formulas, and generating a personalized solution...
      </p>

      {/* Steps Progress */}
      <div className="flex gap-2 items-center">
         <div className="h-1.5 w-8 rounded-full bg-blue-500 animate-[pulse_1s_infinite]"></div>
         <div className="h-1.5 w-8 rounded-full bg-blue-500/40 animate-[pulse_1.5s_infinite_0.2s]"></div>
         <div className="h-1.5 w-8 rounded-full bg-blue-500/20 animate-[pulse_2s_infinite_0.4s]"></div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;