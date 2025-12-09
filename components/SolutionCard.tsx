import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb, ChevronDown, ChevronRight, Calculator, BookOpen } from 'lucide-react';
import { DoubtSolverResponse, SolverMode } from '../types';
import MathMarkdown from './MathMarkdown';

interface SolutionCardProps {
  data: DoubtSolverResponse;
  mode: SolverMode;
}

const SolutionCard: React.FC<SolutionCardProps> = ({ data, mode }) => {
  const [hintIndex, setHintIndex] = useState(0);
  const [showExamSteps, setShowExamSteps] = useState(false);

  // --- HINT MODE ---
  if (mode === 'hint') {
    const visibleHints = data.hints_only.slice(0, hintIndex + 1);
    const hasMoreHints = hintIndex < data.hints_only.length - 1;

    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-6 transition-colors min-h-[400px]">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
             <Lightbulb className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Progressive Hints</h2>
            <p className="text-sm text-gray-400">Try to solve it before revealing the next step.</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {visibleHints.map((hint, idx) => (
            <div key={idx} className="bg-black/20 p-5 rounded-lg border border-white/5 text-gray-100 animate-fadeIn relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500/50"></div>
               <span className="font-bold text-yellow-500 block mb-2 text-xs uppercase tracking-wider">Hint {idx + 1}</span>
               <MathMarkdown text={hint} />
            </div>
          ))}
        </div>

        {hasMoreHints ? (
          <button 
            onClick={() => setHintIndex(prev => prev + 1)}
            className="mt-8 w-full py-4 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl font-bold transition-all flex items-center justify-center gap-2 no-print"
          >
            <Lightbulb className="w-4 h-4" /> Reveal Next Hint
          </button>
        ) : (
          <div className="mt-8 text-center p-4 bg-white/5 rounded-xl text-gray-400">
            <p>All hints revealed! Try checking the full solution in Learning Mode if you're still stuck.</p>
          </div>
        )}
      </div>
    );
  }

  // --- REVISION MODE ---
  if (mode === 'revision') {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-6 transition-colors">
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-blue-500/20 rounded-lg">
             <BookOpen className="w-6 h-6 text-blue-400" />
           </div>
           <h2 className="text-xl font-bold text-white">Key Formulas & Concepts</h2>
        </div>

        <div className="space-y-4">
          {data.step_by_step_solution.length > 0 ? (
             data.step_by_step_solution.map((step, idx) => (
               <div key={idx} className="bg-black/20 p-4 rounded-lg border border-white/5 hover:border-blue-500/30 transition-colors">
                 {step.title && <h4 className="text-blue-400 font-bold text-sm mb-2">{step.title}</h4>}
                 <MathMarkdown text={step.content} className="text-sm" />
               </div>
             ))
          ) : (
            <div className="text-center text-gray-500">No specific formulas extracted.</div>
          )}
          
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Quick Flashcards</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.flashcards.slice(0,4).map((card, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Concept</p>
                    <p className="font-medium text-white mb-2">{card.front}</p>
                    <hr className="border-white/5 my-2"/>
                    <div className="text-sm text-blue-300">
                       <MathMarkdown text={card.back} />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- EXAM MODE ---
  if (mode === 'exam') {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-8 transition-colors">
        <div className="flex items-start gap-4 mb-8">
           <CheckCircle2 className="w-8 h-8 text-green-400 mt-1" />
           <div className="flex-1">
             <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Final Answer</h2>
             <div className="text-2xl font-bold text-white p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
               <MathMarkdown text={data.short_answer} />
             </div>
           </div>
        </div>

        <button 
          onClick={() => setShowExamSteps(!showExamSteps)}
          className="flex items-center gap-2 text-gray-400 hover:text-white font-medium text-sm transition-colors mb-4 no-print"
        >
          {showExamSteps ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {showExamSteps ? "Hide Calculation Steps" : "Show Calculation Steps"}
        </button>

        {showExamSteps && (
          <div className="space-y-4 animate-slideUp">
            {data.step_by_step_solution.map((step, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-black/20 rounded-lg border border-white/5">
                <div className="font-mono text-blue-400 opacity-50">{idx + 1}.</div>
                <div className="text-sm text-gray-200 w-full">
                  <MathMarkdown text={step.content} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- LEARNING MODE (Default) ---
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-6 transition-colors">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
           <Calculator className="w-5 h-5 text-blue-400" /> Step-by-Step Solution
        </h2>
        {data.difficulty.confidence_score < 85 && (
          <span className="flex items-center gap-1 text-xs text-orange-300 bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">
            <AlertTriangle className="w-3 h-3" /> Check carefully
          </span>
        )}
      </div>

      <div className="space-y-8 relative before:absolute before:left-[15px] before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10">
        {data.step_by_step_solution.map((step, idx) => (
          <div key={idx} className="relative flex gap-5 animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black border-2 border-blue-500 text-blue-400 flex items-center justify-center font-bold text-sm z-10 shadow-lg shadow-blue-900/50 print:bg-white print:border-black print:text-black">
              {step.step_number || idx + 1}
            </div>
            <div className="flex-grow pt-1 min-w-0">
               {step.title && <h4 className="font-bold text-white mb-2 text-lg tracking-tight print:text-black">{step.title}</h4>}
               <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors print:bg-transparent print:border-gray-200">
                 <MathMarkdown text={step.content} className="text-gray-100" />
                 {step.concepts_applied && step.concepts_applied.length > 0 && (
                   <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                     {step.concepts_applied.map((concept, cIdx) => (
                       <span key={cIdx} className="text-[10px] uppercase font-bold text-purple-300 bg-purple-500/20 px-2 py-1 rounded border border-purple-500/20 print:text-black print:bg-transparent print:border-black">
                         {concept}
                       </span>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl flex gap-4 items-start shadow-inner page-break-inside-avoid print:bg-none print:border-black">
        <CheckCircle2 className="w-8 h-8 text-blue-400 mt-1 flex-shrink-0 print:text-black" />
        <div className="w-full overflow-hidden">
          <h3 className="font-bold text-blue-400 text-sm uppercase tracking-wide mb-3 print:text-black">Final Answer</h3>
          <div className="text-xl font-medium text-white print:text-black">
            <MathMarkdown text={data.short_answer} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionCard;