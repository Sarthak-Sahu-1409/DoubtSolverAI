import React, { useState, useEffect } from 'react';
import { X, Clock, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { SimilarQuestion } from '../types';
import MathMarkdown from './MathMarkdown';

interface PracticeModalProps {
  question: SimilarQuestion;
  onClose: () => void;
}

const PracticeModal: React.FC<PracticeModalProps> = ({ question, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selfRating, setSelfRating] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    let interval: number;
    if (isActive) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReveal = () => {
    setIsActive(false);
    setShowAnswer(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900/80 backdrop-blur-xl w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isActive ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Practice Mode</h3>
              <p className="text-xs text-gray-400 font-mono">{formatTime(timeLeft)} elapsed</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
          <div className="space-y-6">
            <div>
              <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase mb-2 ${
                  question.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' :
                  question.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                {question.difficulty}
              </span>
              <div className="text-xl font-medium text-white leading-relaxed">
                <MathMarkdown text={question.question} />
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="w-full">
                  <p className="font-bold text-white text-sm mb-1">Hint</p>
                  <div className="text-sm text-gray-400 italic">
                     <MathMarkdown text={question.hint} />
                  </div>
                </div>
              </div>
            </div>

            {!showAnswer ? (
              <div className="pt-4">
                <p className="text-sm text-gray-400 mb-4 text-center">Solve the problem on paper, then check your answer.</p>
                <button 
                  onClick={handleReveal}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-900/40 border border-white/10"
                >
                  Reveal Answer
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-slideUp">
                <div className="border-t border-white/10 pt-6">
                  <h5 className="font-bold text-blue-400 mb-3">Correct Answer</h5>
                  <div className="text-lg text-white font-medium p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                     <MathMarkdown text={question.answer || "Answer not provided. Check the steps."} />
                  </div>
                </div>

                {selfRating === null ? (
                   <div className="text-center">
                     <p className="text-white font-medium mb-4">Did you get it right?</p>
                     <div className="flex justify-center gap-4">
                       <button 
                         onClick={() => setSelfRating('correct')}
                         className="flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-500/30 transition-colors font-bold"
                       >
                         <CheckCircle2 className="w-5 h-5" /> Yes, I did!
                       </button>
                       <button 
                         onClick={() => setSelfRating('incorrect')}
                         className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors font-bold"
                       >
                         <AlertCircle className="w-5 h-5" /> Needs Practice
                       </button>
                     </div>
                   </div>
                ) : (
                  <div className="text-center p-4 bg-white/5 rounded-xl animate-fadeIn border border-white/5">
                    {selfRating === 'correct' ? (
                      <div>
                        <p className="text-2xl mb-2">🎉</p>
                        <p className="font-bold text-white">Great job!</p>
                        <p className="text-sm text-gray-400">Keep up the momentum.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl mb-2">💪</p>
                        <p className="font-bold text-white">Don't worry!</p>
                        <p className="text-sm text-gray-400">Review the solution steps and try again.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeModal;