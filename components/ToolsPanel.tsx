import React, { useState } from 'react';
import { BookOpen, Layers, UserCheck } from 'lucide-react';
import { DoubtSolverResponse, SolverMode } from '../types';
import MathMarkdown from './MathMarkdown';

interface ToolsPanelProps {
  data: DoubtSolverResponse;
  mode: SolverMode;
}

type Tab = 'theory' | 'flashcards' | 'teacher';

const ToolsPanel: React.FC<ToolsPanelProps> = ({ data, mode }) => {
  if (mode === 'exam' || mode === 'hint') {
    return null;
  }

  const initialTab: Tab = mode === 'revision' ? 'flashcards' : 'theory';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleFlip = (index: number) => {
    setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const showTheory = mode === 'learning';
  const showFlashcards = mode === 'learning' || mode === 'revision';
  const showTeacher = mode === 'learning' || mode === 'revision';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'theory':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-bold text-white mb-2">Key Concept Summary</h3>
              <div className="text-gray-300 text-sm">
                <MathMarkdown text={data.theory.summary} />
              </div>
            </div>
            
            {data.theory.key_formulas.length > 0 && (
              <div>
                <h3 className="font-bold text-white mb-3">Formulas Used</h3>
                <div className="grid gap-3">
                  {data.theory.key_formulas.map((f, i) => (
                    <div key={i} className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-blue-400 text-sm">{f.name}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded border border-white/5 text-center text-white my-3 overflow-x-auto shadow-inner">
                        {/* Removed manual $$ wrapping as formula_latex usually contains delimiters from prompt instructions */}
                        <MathMarkdown text={f.formula_latex} />
                      </div>
                      <p className="text-xs text-gray-500">{f.usage}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'flashcards':
        return (
          <div className="grid grid-cols-1 gap-4 animate-fadeIn">
            {data.flashcards.map((card, idx) => (
              <div 
                key={idx} 
                className={`flip-card h-48 w-full cursor-pointer ${flippedCards[idx] ? 'flipped' : ''}`}
                onClick={() => toggleFlip(idx)}
              >
                <div className="flip-card-inner">
                  {/* Front */}
                  <div className="flip-card-front bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 text-white p-6 flex flex-col items-center justify-center shadow-lg rounded-xl overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
                    <span className="text-xs uppercase tracking-widest text-blue-400 mb-2 opacity-80 flex-shrink-0">{card.tag}</span>
                    <div className="font-bold text-lg text-center leading-tight">
                        <MathMarkdown text={card.front} />
                    </div>
                    <p className="text-xs absolute bottom-2 text-gray-400 no-print">Tap to flip</p>
                  </div>
                  {/* Back */}
                  <div className="flip-card-back bg-black/80 border border-blue-500/30 text-white p-6 flex items-center justify-center shadow-lg rounded-xl backdrop-blur-xl overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
                    <div className="text-center w-full">
                         <MathMarkdown text={card.back} className="font-medium text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {data.flashcards.length === 0 && (
               <div className="text-center text-gray-500 py-10">No flashcards available for this problem.</div>
            )}
          </div>
        );

      case 'teacher':
        return (
          <div className="space-y-5 animate-fadeIn">
             <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-500/20">
               <h3 className="font-bold text-amber-500 mb-2 text-sm uppercase">Common Mistakes</h3>
               <ul className="list-disc list-inside space-y-1">
                 {data.common_mistakes.map((m, i) => (
                   <li key={i} className="text-sm text-gray-300">
                     <MathMarkdown text={m} className="inline" />
                   </li>
                 ))}
               </ul>
             </div>

             <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/20">
               <h3 className="font-bold text-blue-400 mb-2 text-sm uppercase">Where Students Struggle</h3>
               <ul className="list-disc list-inside space-y-1">
                 {data.teacher_notes.where_student_may_struggle.map((m, i) => (
                   <li key={i} className="text-sm text-gray-300">
                     <MathMarkdown text={m} className="inline" />
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col h-full transition-colors sticky top-6">
      <div className="flex border-b border-white/10 no-print">
        {showTheory && (
          <button 
            onClick={() => setActiveTab('theory')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'theory' ? 'text-white border-b-2 border-blue-500 bg-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <BookOpen className="w-4 h-4" /> Theory
          </button>
        )}
        {showFlashcards && (
          <button 
            onClick={() => setActiveTab('flashcards')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'flashcards' ? 'text-white border-b-2 border-blue-500 bg-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Layers className="w-4 h-4" /> Cards
          </button>
        )}
        {showTeacher && (
          <button 
            onClick={() => setActiveTab('teacher')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'teacher' ? 'text-white border-b-2 border-blue-500 bg-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <UserCheck className="w-4 h-4" /> Tutor
          </button>
        )}
      </div>
      
      <div className="p-6 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ToolsPanel;