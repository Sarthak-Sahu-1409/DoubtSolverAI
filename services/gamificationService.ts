
import { UserStats } from '../types';

const STORAGE_KEY = 'doubtsolver_user_stats';

const DEFAULT_STATS: UserStats = {
  streak: 0,
  lastLoginDate: '',
  problemsSolved: 0,
  xp: 0,
  mastery: {},
  achievements: []
};

export const getStats = (): UserStats => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_STATS;
  } catch (e) {
    return DEFAULT_STATS;
  }
};

export const saveStats = (stats: UserStats) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

export const checkStreak = (): { active: boolean; streak: number; justIncremented: boolean } => {
  const stats = getStats();
  const today = new Date().toDateString();
  const lastLogin = stats.lastLoginDate ? new Date(stats.lastLoginDate).toDateString() : '';

  let justIncremented = false;

  if (lastLogin !== today) {
    // Check if yesterday was the last login
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastLogin === yesterday.toDateString()) {
      stats.streak += 1;
    } else if (lastLogin === '') {
      stats.streak = 1; // First login
    } else {
      stats.streak = 1; // Streak broken
    }
    
    stats.lastLoginDate = new Date().toISOString();
    saveStats(stats);
    justIncremented = true;
  }

  return { active: true, streak: stats.streak, justIncremented };
};

export const recordProblemSolved = (subject: string, difficulty: string) => {
  const stats = getStats();
  stats.problemsSolved += 1;
  
  // XP Calculation
  const xpBase = 100;
  const multiplier = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.5 : 1;
  stats.xp += Math.round(xpBase * multiplier);

  // Mastery System
  const currentMastery = stats.mastery[subject] || 0;
  // Logarithmic growth for mastery to make it harder at higher levels
  const increment = Math.max(1, Math.round(10 * multiplier * (1 - currentMastery / 100)));
  stats.mastery[subject] = Math.min(100, currentMastery + increment);

  // Achievements
  if (stats.problemsSolved === 1) _addAchievement(stats, 'First Blood');
  if (stats.problemsSolved === 10) _addAchievement(stats, 'Problem Solver');
  if (stats.streak === 3) _addAchievement(stats, 'On Fire');
  if (stats.streak === 7) _addAchievement(stats, 'Week Warrior');
  if (stats.mastery[subject] >= 50) _addAchievement(stats, `${subject} Apprentice`);
  if (stats.mastery[subject] >= 90) _addAchievement(stats, `${subject} Master`);

  saveStats(stats);
  return stats;
};

const _addAchievement = (stats: UserStats, title: string) => {
  if (!stats.achievements.includes(title)) {
    stats.achievements.push(title);
  }
};
