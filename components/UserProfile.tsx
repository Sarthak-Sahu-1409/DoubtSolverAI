
import React from 'react';
import { UserStats } from '../types';
import { X, Trophy, Flame, Target, Star, Medal } from 'lucide-react';

interface UserProfileProps {
  stats: UserStats;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ stats, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900/90 w-full max-w-3xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with Gradient */}
        <div className="relative bg-gradient-to-r from-blue-900 to-purple-900 p-8 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 rounded-full hover:bg-black/40 text-white">
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-black border-4 border-blue-400 shadow-xl mb-4">
            <span className="text-3xl font-bold text-white">JS</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Student Profile</h2>
          <p className="text-blue-200">Level {Math.floor(stats.xp / 1000) + 1} Scholar</p>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
              <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.streak}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Day Streak</div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.xp}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Total XP</div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
              <Target className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.problemsSolved}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Solved</div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
              <Trophy className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.achievements.length}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Badges</div>
            </div>
          </div>

          {/* Mastery Section */}
          <div>
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Medal className="w-5 h-5 text-blue-400" /> Topic Mastery
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(stats.mastery).length > 0 ? (
                Object.entries(stats.mastery).map(([topic, level]) => (
                  <div key={topic} className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-white capitalize">{topic}</span>
                      <span className="text-blue-400 font-mono">{level}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${level}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-gray-500 py-8">
                  No mastery data yet. Solve problems to track progress!
                </div>
              )}
            </div>
          </div>

          {/* Achievements List */}
          <div>
            <h3 className="font-bold text-white mb-4">Recent Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {stats.achievements.length > 0 ? (
                stats.achievements.map((badge, i) => (
                  <span key={i} className="px-3 py-1 bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 rounded-full text-sm font-medium flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> {badge}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 italic">No badges earned yet.</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
