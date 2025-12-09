import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Loader2, PenTool, Image as ImageIcon, Download, Pause, Play, Square } from 'lucide-react';
import { generateAudioExplanation, generateVisualSolution } from '../services/geminiService';
import { DoubtSolverResponse } from '../types';

interface MediaPanelProps {
  data: DoubtSolverResponse;
  originalImage?: string | null;
}

const MediaPanel: React.FC<MediaPanelProps> = ({ data, originalImage }) => {
  // Audio State
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Audio Context Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startedAtRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Visual Solution State
  const [loadingVisual, setLoadingVisual] = useState(false);
  const [visualSolutionUrl, setVisualSolutionUrl] = useState<string | null>(null);

  // Initialize Audio Context on mount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const fetchAudio = async () => {
    setLoadingAudio(true);
    try {
      const summary = data.theory.summary || "Here is the solution summary.";
      const buffer = await generateAudioExplanation(summary);
      setAudioBuffer(buffer);
      return buffer;
    } catch (e) {
      console.error("Audio generation failed", e);
      alert("Failed to generate audio. Please try again.");
      return null;
    } finally {
      setLoadingAudio(false);
    }
  };

  const playAudio = async () => {
    initAudioContext();
    const ctx = audioCtxRef.current!;

    let buffer = audioBuffer;
    if (!buffer) {
      buffer = await fetchAudio();
      if (!buffer) return;
    }

    if (ctx.state === 'suspended') {
        await ctx.resume();
    }

    sourceRef.current = ctx.createBufferSource();
    sourceRef.current.buffer = buffer;
    sourceRef.current.connect(ctx.destination);
    
    // Start playback from stored offset
    const offset = pausedAtRef.current % buffer.duration;
    sourceRef.current.start(0, offset);
    startedAtRef.current = ctx.currentTime - offset;

    sourceRef.current.onended = () => {
        // Only reset if we reached the end naturally (not stopped manually)
        if (ctx.currentTime - startedAtRef.current >= buffer!.duration) {
            setIsPlaying(false);
            pausedAtRef.current = 0;
        }
    };

    setIsPlaying(true);
  };

  const pauseAudio = () => {
    if (sourceRef.current && audioCtxRef.current) {
        sourceRef.current.stop();
        pausedAtRef.current = audioCtxRef.current.currentTime - startedAtRef.current;
        setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (sourceRef.current) {
        try {
            sourceRef.current.stop();
        } catch (e) { /* ignore if already stopped */ }
    }
    pausedAtRef.current = 0;
    setIsPlaying(false);
  };

  const toggleAudio = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const handleVisualSolution = async () => {
    if (loadingVisual || visualSolutionUrl) return;
    
    if (!originalImage) {
        alert("Original image not found. Cannot generate visual overlay.");
        return;
    }

    setLoadingVisual(true);
    try {
        const url = await generateVisualSolution(originalImage);
        setVisualSolutionUrl(url);
    } catch (e) {
        console.error("Visual solution failed", e);
        alert("Failed to generate visual solution.");
    } finally {
        setLoadingVisual(false);
    }
  };

  const handleDownloadVisual = () => {
    if (!visualSolutionUrl) return;
    const link = document.createElement('a');
    link.href = visualSolutionUrl;
    link.download = 'doubt-solver-visual-solution.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg mb-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <PenTool className="w-5 h-5 text-pink-400" />
        Media & Visual Learning
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Audio Player */}
        <div className={`flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 rounded-xl transition-all group h-full ${isPlaying ? 'border-blue-400/50 shadow-blue-900/20 shadow-lg' : ''}`}>
           <div className="flex items-center gap-3 min-w-0">
               {loadingAudio ? (
                   <div className="p-3 bg-blue-500 rounded-full">
                       <Loader2 className="w-4 h-4 animate-spin text-white" />
                   </div>
               ) : (
                   <button 
                       onClick={toggleAudio}
                       className={`p-3 rounded-full transition-transform hover:scale-110 flex-shrink-0 ${isPlaying ? 'bg-yellow-500' : 'bg-blue-500'}`}
                   >
                       {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                   </button>
               )}
               <div className="min-w-0">
                   <span className="block font-bold text-white text-sm">{isPlaying ? 'Playing...' : 'Audio Explanation'}</span>
                   <span className="block text-xs text-gray-400 truncate">{audioBuffer ? 'Ready to play' : 'Tap to generate'}</span>
               </div>
           </div>
           
           {(isPlaying || (audioBuffer && pausedAtRef.current > 0)) && (
               <button 
                   onClick={stopAudio}
                   className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-400 transition-colors"
                   title="Stop & Reset"
               >
                   <Square className="w-4 h-4 fill-current" />
               </button>
           )}
        </div>

         {/* Visual Solution Button */}
         {originalImage && (
             <button
             onClick={handleVisualSolution}
             disabled={loadingVisual || !!visualSolutionUrl}
             className={`flex items-center justify-center gap-3 p-4 border border-white/10 rounded-xl transition-all group h-full ${
                 visualSolutionUrl ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-gradient-to-r from-indigo-900/40 to-cyan-900/40 hover:border-indigo-400/50'
             }`}
             >
             {loadingVisual ? (
                 <>
                    <Loader2 className="w-5 h-5 animate-spin text-white flex-shrink-0" />
                    <div className="text-left min-w-0 animate-pulse">
                        <span className="block font-bold text-white text-sm">Solving...</span>
                        <span className="block text-xs text-indigo-300 truncate">Analyzing Pixels</span>
                    </div>
                 </>
             ) : visualSolutionUrl ? (
                 <div className="flex items-center gap-2">
                     <div className="p-2 bg-indigo-500 rounded-full flex-shrink-0">
                     <ImageIcon className="w-4 h-4 text-white" />
                     </div>
                     <div className="text-left min-w-0">
                     <span className="block font-bold text-white text-sm">Solved</span>
                     <span className="block text-xs text-gray-400 truncate">Image Overlay</span>
                     </div>
                 </div>
             ) : (
                 <>
                 <div className="p-2 bg-indigo-500 rounded-full group-hover:scale-110 transition-transform flex-shrink-0">
                     <PenTool className="w-4 h-4 text-white" />
                 </div>
                 <div className="text-left min-w-0">
                     <span className="block font-bold text-white text-sm">Solve</span>
                     <span className="block text-xs text-gray-400 truncate">On Image</span>
                 </div>
                 </>
             )}
             </button>
         )}
      </div>

      {/* Visual Solution Area */}
      {visualSolutionUrl && (
          <div className="mt-6 rounded-xl overflow-hidden border border-white/20 shadow-2xl animate-slideUp bg-black/40">
               <div className="flex justify-between items-center p-3 bg-white/5 border-b border-white/10">
                 <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Visual Solution Overlay</h4>
                 <button 
                   onClick={handleDownloadVisual}
                   className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                 >
                   <Download className="w-3 h-3" /> Download Image
                 </button>
               </div>
              <img 
                  src={visualSolutionUrl} 
                  alt="Solved Problem" 
                  className="w-full h-auto object-contain"
              />
          </div>
      )}
    </div>
  );
};

export default MediaPanel;