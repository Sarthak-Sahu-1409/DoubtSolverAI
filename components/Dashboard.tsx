
import React, { useState } from 'react';
import { BarChart, Clock, Zap, Tag, Timer, Download, Network, Target, Edit, FileText, Check } from 'lucide-react';
import { DoubtSolverResponse, SolverMode, SimilarQuestion } from '../types';
import SolutionCard from './SolutionCard';
import ToolsPanel from './ToolsPanel';
import PracticeModal from './PracticeModal';
import TutorChat from './TutorChat';
import MediaPanel from './MediaPanel';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { checkStudentAttempt, generatePracticeExam } from '../services/geminiService';
import { recordProblemSolved } from '../services/gamificationService';

interface DashboardProps {
  data: DoubtSolverResponse;
  mode: SolverMode;
  originalImage?: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ data, mode, originalImage }) => {
  const [practiceQuestion, setPracticeQuestion] = useState<SimilarQuestion | null>(null);
  const [chatTrigger, setChatTrigger] = useState<string | undefined>(undefined);
  
  // Student Attempt Logic
  const [showCheckWork, setShowCheckWork] = useState(false);
  const [studentAttemptText, setStudentAttemptText] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  // Exam Gen Logic
  const [generatingExam, setGeneratingExam] = useState(false);

  const confidenceData = [
    { name: 'Confident', value: data.difficulty.confidence_score },
    { name: 'Uncertain', value: 100 - data.difficulty.confidence_score },
  ];
  
  const COLORS = ['#3b82f6', 'rgba(255,255,255,0.05)']; 
  const isFullWidthMode = mode === 'exam' || mode === 'hint';

  // Record stats on mount (once)
  React.useEffect(() => {
    if (data) {
      recordProblemSolved(data.question_understanding.detected_subject, data.difficulty.level);
    }
  }, [data]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleCheckWork = async () => {
    if (!studentAttemptText.trim()) return;
    setChecking(true);
    try {
      const res = await checkStudentAttempt(
        data.question_understanding.clean_question,
        data.short_answer,
        studentAttemptText
      );
      setCheckResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  const handleGenerateExam = async () => {
    setGeneratingExam(true);
    try {
      const exam = await generatePracticeExam(data.question_understanding.detected_subject, data.difficulty.level);
      // For now, we'll just log it or alert it, but ideally this opens a new modal
      alert(`Exam Generated: ${exam.title}. Check console for JSON.`);
      console.log(exam);
    } catch (e) {
      alert("Failed to generate exam.");
    } finally {
      setGeneratingExam(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Stats Row */}
      <div className="flex flex-wrap gap-4 justify-end no-print min-h-[40px]">
         <button 
           onClick={() => setShowCheckWork(!showCheckWork)}
           className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-lg text-sm font-bold transition-colors"
         >
           <Edit className="w-4 h-4" /> Check My Attempt
         </button>
         <button 
           onClick={handleGenerateExam}
           disabled={generatingExam}
           className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 rounded-lg text-sm font-bold transition-colors"
         >
           {generatingExam ? "Generating..." : <><FileText className="w-4 h-4" /> Generate Mini-Exam</>}
         </button>
         <button 
           onClick={handleExportPDF}
           className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors"
         >
           <Download className="w-4 h-4" /> Revision Sheet (PDF)
         </button>
      </div>

      {/* Check Work Modal / Area */}
      {showCheckWork && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-slideUp">
           <h3 className="font-bold text-white mb-4">Paste your work for review:</h3>
           <textarea 
             className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-white font-mono text-sm focus:border-blue-500 outline-none"
             rows={5}
             placeholder="I integrated x^2 to get x^3/3..."
             value={studentAttemptText}
             onChange={e => setStudentAttemptText(e.target.value)}
           />
           <div className="mt-4 flex gap-4 items-center">
             <button onClick={handleCheckWork} disabled={checking} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold text-white">
               {checking ? "Analyzing..." : "Analyze Error"}
             </button>
             {checkResult && (
               <div className={`flex items-center gap-2 ${checkResult.correct ? 'text-green-400' : 'text-red-400'}`}>
                 {checkResult.correct ? <Check className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                 <span className="font-bold">{checkResult.correct ? "Correct!" : "Mistake Found"}</span>
               </div>
             )}
           </div>
           {checkResult && !checkResult.correct && (
             <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
               <p className="text-white mb-2">{checkResult.feedback}</p>
               <p className="font-mono text-sm text-yellow-300">Fix: {checkResult.correction}</p>
             </div>
           )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Difficulty */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-lg flex items-center gap-4">
           <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg flex-shrink-0"><BarChart className="w-6 h-6" /></div>
           <div className="min-w-0">
             <p className="text-xs text-blue-200/60 font-medium uppercase tracking-wider">Difficulty</p>
             <p className="font-bold text-white capitalize truncate">{data.difficulty.level.replace('_', ' ')}</p>
           </div>
        </div>
        {/* Est Time */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-lg flex items-center gap-4">
           <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg flex-shrink-0"><Clock className="w-6 h-6" /></div>
           <div className="min-w-0">
             <p className="text-xs text-purple-200/60 font-medium uppercase tracking-wider">Est. Time</p>
             <p className="font-bold text-white truncate">{data.difficulty.estimated_student_time_minutes} mins</p>
           </div>
        </div>
        {/* Confidence */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-lg flex items-center gap-4">
           <div className="w-16 h-16 relative flex-shrink-0">
               {/* Explicit size for Recharts container to prevent resizing loop */}
               <div className="w-16 h-16">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={confidenceData} innerRadius={18} outerRadius={28} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                       {confidenceData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                     </Pie>
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
               {Math.round(data.difficulty.confidence_score)}%
             </div>
           </div>
           <div className="min-w-0">
             <p className="text-xs text-blue-200/60 font-medium uppercase tracking-wider">Confidence</p>
             <p className="text-xs text-white/80 truncate">AI Certainty</p>
           </div>
        </div>
        {/* Subject */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-lg flex items-center gap-4">
           <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg flex-shrink-0"><Zap className="w-6 h-6" /></div>
           <div className="min-w-0">
             <p className="text-xs text-amber-200/60 font-medium uppercase tracking-wider">Subject</p>
             <p className="font-bold text-white truncate">{data.question_understanding.detected_subject}</p>
           </div>
        </div>
      </div>

      {/* Deep Learning Analysis */}
      {!isFullWidthMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slideUp">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-xl shadow-lg group">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400"><Network className="w-5 h-5" /></div>
               <h3 className="font-bold text-white text-sm uppercase tracking-wide">Prerequisite Concepts</h3>
             </div>
             <div className="flex flex-wrap gap-2">
               {data.prerequisite_concepts?.map((c, i) => (
                 <span key={i} className="px-3 py-1 bg-pink-500/10 text-pink-300 border border-pink-500/20 rounded-full text-xs font-medium">{c}</span>
               ))}
             </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-xl shadow-lg group">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Target className="w-5 h-5" /></div>
               <h3 className="font-bold text-white text-sm uppercase tracking-wide">Skills & Competencies</h3>
             </div>
             <div className="flex flex-wrap gap-2">
               {data.skills_tested?.map((s, i) => (
                 <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-xs font-medium">{s}</span>
               ))}
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        <div className={`${isFullWidthMode ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6 min-w-0`}>
          {!isFullWidthMode && <MediaPanel data={data} originalImage={originalImage} />}
          <SolutionCard data={data} mode={mode} onExplainStep={(txt) => setChatTrigger(txt)} />
          
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-400" /> Practice More
            </h3>
            <div className="grid gap-3">
              {data.similar_questions.map((q, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-blue-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/20">{q.difficulty}</span>
                    <button onClick={() => setPracticeQuestion(q)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] bg-blue-600 text-white font-bold px-3 py-1 rounded-full no-print">
                      <Timer className="w-3 h-3" /> Practice
                    </button>
                  </div>
                  <p className="text-sm text-gray-200 font-medium mb-2">{q.question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!isFullWidthMode && (
          // Sticky Sidebar Container for Desktop
          <div className="lg:col-span-1 space-y-6 lg:space-y-4 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:flex lg:flex-col lg:overflow-hidden z-20">
            <TutorChat data={data} initialMessage={chatTrigger} />
            <ToolsPanel data={data} mode={mode} />
          </div>
        )}
      </div>

      {practiceQuestion && <PracticeModal question={practiceQuestion} onClose={() => setPracticeQuestion(null)} />}
    </div>
  );
};

export default Dashboard;
