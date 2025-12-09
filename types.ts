
export type SolverMode = 'learning' | 'exam' | 'hint' | 'revision';
export type DifficultyLevel = 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard';

declare global {
  interface Window {
    katex: any;
  }
}

export interface KeyFormula {
  name: string;
  formula_latex: string;
  usage: string;
}

export interface Flashcard {
  front: string;
  back: string;
  tag: string;
}

export interface SimilarQuestion {
  difficulty: string;
  question: string;
  hint: string;
  answer: string;
}

export interface Step {
  step_number: number;
  title: string;
  content: string;
  concepts_applied: string[];
}

export interface DoubtSolverResponse {
  question_understanding: {
    raw_ocr_text: string;
    clean_question: string;
    diagram_reconstruction: string;
    detected_subject: string;
    topic_tags: string[];
  };
  difficulty: {
    level: DifficultyLevel;
    estimated_student_time_minutes: number;
    confidence_score: number;
    uncertainty_notes: string;
  };
  short_answer: string;
  step_by_step_solution: Step[];
  hints_only: string[];
  common_mistakes: string[];
  prerequisite_concepts: string[];
  skills_tested: string[];
  theory: {
    summary: string;
    key_points: string[];
    key_formulas: KeyFormula[];
  };
  flashcards: Flashcard[];
  solution_latex: string;
  similar_questions: SimilarQuestion[];
  teacher_notes: {
    where_student_may_struggle: string[];
    recommended_followup_topics: string[];
    progression_level: string;
  };
  language_used: string;
  safety_and_integrity: {
    is_homework_like: boolean;
    mode_used: string;
    message_to_student: string;
  };
}