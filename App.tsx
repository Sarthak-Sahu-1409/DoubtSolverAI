import React, { useState } from 'react';
import { Brain, Sparkles, AlertCircle, Languages, GraduationCap } from 'lucide-react';
import { DoubtSolverResponse, SolverMode } from './types';
import { analyzeImage } from './services/geminiService';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import LoadingState from './components/LoadingState';

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DoubtSolverResponse | null>(null);

  // Configuration State
  const [mode, setMode] = useState<SolverMode>('learning');
  const [language, setLanguage] = useState<string>('English');
  
  // Default to Dark Mode (Glassmorphism relies on dark bg)

  const handleSolve = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeImage(image, mode, language);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze the image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 font-sans relative overflow-x-hidden selection:bg-blue-500/30">
      
      {/* Ambient Background Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none no-print">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/30 blur-[120px] mix-blend-screen opacity-50"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-900/20 blur-[100px] mix-blend-screen opacity-50"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-900/20 blur-[130px] mix-blend-screen opacity-30"></div>
      </div>

      {/* Navbar - Glassmorphism */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-lg text-white shadow-lg shadow-blue-900/20">
              <Brain className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">DoubtSolver AI</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 border border-white/10 flex items-center justify-center text-white font-bold text-xs shadow-inner">
               JS
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        
        {/* Header Section */}
        {!result && !loading && (
          <div className="text-center mb-10 animate-fadeIn no-print">
            <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight drop-shadow-sm">
              Master any problem, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">instantly.</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Upload your homework to get step-by-step solutions, conceptual breakdowns, and personalized practice.
            </p>
          </div>
        )}

        {/* Configuration Bar - Glassmorphism */}
        <div className={`rounded-2xl border border-white/10 p-4 mb-8 flex flex-wrap gap-4 items-center justify-between transition-all duration-500 bg-white/5 backdrop-blur-md shadow-2xl no-print ${result ? 'sticky top-20 z-30' : ''}`}>
           <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
             <div className="flex items-center gap-2 border-r border-white/10 pr-4">
               <GraduationCap className="w-4 h-4 text-blue-400" />
               <select 
                 value={mode} 
                 onChange={(e) => setMode(e.target.value as SolverMode)}
                 className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer [&>option]:bg-gray-900 [&>option]:text-white"
                 disabled={loading}
               >
                 <option value="learning">Learning Mode (Detailed)</option>
                 <option value="exam">Exam Mode (Concise)</option>
                 <option value="hint">Hint Mode (No Answer)</option>
                 <option value="revision">Revision Mode (Formulas)</option>
               </select>
             </div>
             
             <div className="flex items-center gap-2">
               <Languages className="w-4 h-4 text-purple-400" />
               <select 
                 value={language}
                 onChange={(e) => setLanguage(e.target.value)}
                 className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer [&>option]:bg-gray-900 [&>option]:text-white"
                 disabled={loading}
               >
                 <option value="English">English</option>
                 <option value="Spanish">Spanish</option>
                 <option value="Hindi">Hindi</option>
                 <option value="French">French</option>
               </select>
             </div>
           </div>

           {result && (
             <button 
               onClick={() => { setResult(null); setImage(null); }}
               className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
             >
               Start New Problem
             </button>
           )}
        </div>

        {/* Upload Section (Hidden if result exists) */}
        {!result && (
          <div className="max-w-2xl mx-auto space-y-8 no-print">
            <FileUpload 
              image={image} 
              setImage={setImage} 
              disabled={loading}
            />
            
            {loading ? (
               <LoadingState />
            ) : (
              <button
                onClick={handleSolve}
                disabled={!image}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3
                  ${!image 
                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-white/5' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-900/30 border border-white/10'
                  }`}
              >
                <Sparkles className="w-5 h-5" />
                Solve & Explain
              </button>
            )}

            {error && (
              <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 flex items-center gap-3 text-sm backdrop-blur-md">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Results Dashboard */}
        {result && (
          <div className="animate-slideUp pb-20">
             <Dashboard data={result} mode={mode} />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;