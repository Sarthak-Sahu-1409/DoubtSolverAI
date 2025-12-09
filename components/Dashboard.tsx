import React, { useState } from 'react';
import { BarChart, Clock, Zap, Tag, Timer, Download, Network, Target } from 'lucide-react';
import { DoubtSolverResponse, SolverMode, SimilarQuestion } from '../types';
import SolutionCard from './SolutionCard';
import ToolsPanel from './ToolsPanel';
import PracticeModal from './PracticeModal';
import TutorChat from './TutorChat';
import MediaPanel from './MediaPanel';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  data: DoubtSolverResponse;
  mode: SolverMode;
  originalImage?: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ data, mode, originalImage }) => {
  const [practiceQuestion, setPracticeQuestion] = useState<SimilarQuestion | null>(null);

  const confidenceData = [
    { name: 'Confident', value: data.difficulty.confidence_score },
    { name: 'Uncertain', value: 100 - data.difficulty.confidence_score },
  ];
  
  // Electric Blue & Dark
  const COLORS = ['#3b82f6', 'rgba(255,255,255,0.05)']; 

  const isFullWidthMode = mode === 'exam' || mode === 'hint';

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Stats Row - Glassmorphism */}
      <div className="flex justify-end no-print">
         <button 
           onClick={handleExportPDF}
           className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors"
         >
           <Download className="w-4 h-4" /> Export PDF
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Difficulty */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-lg flex items-center gap-4 hover:bg-white/10 transition-colors">
           <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
             <BarChart className="w-6 h-6" />
           </div>
           <div>
             <p className="text-xs text-blue-200/60 font-medium uppercase tracking-wider">Difficulty</p>
             <p className="font-bold text-white capitalize">{data.difficulty.level.replace('_', ' ')}</p>
           </div>
        </div>

        {/* Est Time */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-lg flex items-center gap-4 hover:bg-white/10 transition-colors">
           <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">
             <Clock className="w-6 h-6" />
           </div>
           <div>
             <p className="text-xs text-purple-200/60 font-medium uppercase tracking-wider">Est. Time</p>
             <p className="font-bold text-white">{data.difficulty.estimated_student_time_minutes} mins</p>
           </div>
        </div>

        {/* Confidence (Fixed Size) */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-lg flex items-center gap-4 hover:bg-white/10 transition-colors">
           <div className="h-16 w-16 relative flex-shrink-0">
             {/* CRITICAL FIX: Wrapped in specific width/height div */}
             <div className="w-16 h-16">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={confidenceData}
                     innerRadius={18}
                     outerRadius={28}
                     paddingAngle={0}
                     dataKey="value"
                     stroke="none"
                     startAngle={90}
                     endAngle={-270}
                   >
                     {confidenceData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
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
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-lg flex items-center gap-4 hover:bg-white/10 transition-colors">
           <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg">
             <Zap className="w-6 h-6" />
           </div>
           <div className="min-w-0">
             <p className="text-xs text-amber-200/60 font-medium uppercase tracking-wider">Subject</p>
             <p className="font-bold text-white truncate">{data.question_understanding.detected_subject}</p>
           </div>
        </div>
      </div>

      {/* Deep Learning Analysis Section */}
      {!isFullWidthMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slideUp" style={{ animationDelay: '100ms' }}>
          {/* Prerequisites */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-xl shadow-lg hover:bg-white/10 transition-colors group">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400 group-hover:scale-110 transition-transform">
                 <Network className="w-5 h-5" />
               </div>
               <h3 className="font-bold text-white text-sm uppercase tracking-wide">Prerequisite Concepts</h3>
             </div>
             <div className="flex flex-wrap gap-2">
               {data.prerequisite_concepts?.map((concept, idx) => (
                 <span key={idx} className="px-3 py-1 bg-pink-500/10 text-pink-300 border border-pink-500/20 rounded-full text-xs font-medium">
                   {concept}
                 </span>
               ))}
               {(!data.prerequisite_concepts || data.prerequisite_concepts.length === 0) && (
                  <span className="text-gray-500 text-xs italic">No specific prerequisites detected.</span>
               )}
             </div>
          </div>

          {/* Skills Tested */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-xl shadow-lg hover:bg-white/10 transition-colors group">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                 <Target className="w-5 h-5" />
               </div>
               <h3 className="font-bold text-white text-sm uppercase tracking-wide">Skills & Competencies</h3>
             </div>
             <div className="flex flex-wrap gap-2">
               {data.skills_tested?.map((skill, idx) => (
                 <span key={idx} className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-xs font-medium">
                   {skill}
                 </span>
               ))}
                {(!data.skills_tested || data.skills_tested.length === 0) && (
                  <span className="text-gray-500 text-xs italic">No specific skills listed.</span>
               )}
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${isFullWidthMode ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6 transition-all duration-300`}>
          
          {/* New Media Panel for Video/Audio */}
          {!isFullWidthMode && <MediaPanel data={data} originalImage={originalImage} />}

          <SolutionCard data={data} mode={mode} />
          
          {/* Similar Questions Block - Glassmorphism */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-400" /> Practice More (Similar Questions)
            </h3>
            <div className="grid gap-3">
              {data.similar_questions.map((q, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-blue-500/50 transition-all group hover:bg-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      q.difficulty === 'easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                      q.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {q.difficulty}
                    </span>
                    <button 
                      onClick={() => setPracticeQuestion(q)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] bg-blue-600 text-white font-bold px-3 py-1 rounded-full hover:bg-blue-500 shadow-lg shadow-blue-900/20 no-print"
                    >
                      <Timer className="w-3 h-3" /> Practice
                    </button>
                  </div>
                  <p className="text-sm text-gray-200 font-medium mb-2 leading-relaxed">{q.question}</p>
                  <p className="text-xs text-gray-500 italic">Hint: {q.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!isFullWidthMode && (
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-6 space-y-6">
              <TutorChat data={data} />
              <ToolsPanel data={data} mode={mode} />
            </div>
          </div>
        )}
      </div>

      {practiceQuestion && (
        <PracticeModal 
          question={practiceQuestion} 
          onClose={() => setPracticeQuestion(null)} 
        />
      )}
    </div>
  );
};

export default Dashboard;