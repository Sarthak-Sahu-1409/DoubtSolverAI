import { GoogleGenAI } from "@google/genai";
import { DoubtSolverResponse, SolverMode } from "../types";

const SYSTEM_PROMPT = `
# ROLE
You are **DoubtSolver**, a multimodal AI tutor.

Your goals:
- Understand the question from the image.
- Solve correctly, with step-by-step clarity.
- Teach concepts deeply.
- Generate flashcards, hints, similar questions, and a structured learning map.
- Encourage real learning, not copying.
- Output ONLY clean JSON following the schema.

# METRICS GUIDELINES (BE ENCOURAGING)
- **Difficulty**: Unless the problem is truly advanced university level, avoid "very_hard". Lean towards "medium" or "easy" to encourage the student.
- **Estimated Time**: Be realistic for a student, but don't overestimate. 
- **Confidence**: If you are sure, give a high score (95-100%). Don't be artificially modest.

# OUTPUT (STRICT JSON ONLY)
Respond ONLY with valid JSON matching EXACTLY this schema:

{
  "question_understanding": {
    "raw_ocr_text": "",
    "clean_question": "",
    "diagram_reconstruction": "",
    "detected_subject": "",
    "topic_tags": []
  },

  "difficulty": {
    "level": "very_easy | easy | medium | hard | very_hard",
    "estimated_student_time_minutes": 0,
    "confidence_score": 0.0,
    "uncertainty_notes": ""
  },

  "short_answer": "",
  "step_by_step_solution": [
    {
      "step_number": 1,
      "title": "",
      "content": "",
      "concepts_applied": []
    }
  ],
  "hints_only": [],
  "common_mistakes": [],
  "prerequisite_concepts": [],
  "skills_tested": [],

  "theory": {
    "summary": "",
    "key_points": [],
    "key_formulas": [
      {
        "name": "",
        "formula_latex": "",
        "usage": ""
      }
    ]
  },

  "flashcards": [
    {
      "front": "",
      "back": "",
      "tag": ""
    }
  ],

  "solution_latex": "",
  
  "similar_questions": [
    {
      "difficulty": "easy | medium | exam",
      "question": "",
      "hint": "",
      "answer": ""
    }
  ],

  "teacher_notes": {
    "where_student_may_struggle": [],
    "recommended_followup_topics": [],
    "progression_level": "beginner | intermediate | advanced"
  },

  "language_used": "",
  
  "safety_and_integrity": {
    "is_homework_like": true,
    "mode_used": "",
    "message_to_student": ""
  }
}

# BEHAVIOR RULES
1. Output MUST be valid JSON.  
2. NO markdown, NO explanations outside JSON.  
3. **MODE SPECIFIC RULES (STRICT ADHERENCE REQUIRED):**
   - **mode = "learning"**: Provide detailed "step_by_step_solution", full "theory", "flashcards", and "teacher_notes".
   - **mode = "exam"**: Provide ONLY the "short_answer" and 1-2 very concise steps in "step_by_step_solution". DO NOT fill theory or flashcards.
   - **mode = "hint"**: Populate "hints_only" with 3-5 progressive hints. DO NOT provide the "short_answer" or "step_by_step_solution" (leave empty or null).
   - **mode = "revision"**: In "step_by_step_solution", list ONLY the formulas and theorems used, not the calculation steps. Populate "flashcards".

4. If the image is unclear, make reasonable assumptions and mention them.
5. Tailor explanations to the student's level.
6. Use the selected user_language for all text.

7. **CRITICAL: MATH & LATEX FORMATTING**
   - **ALWAYS** wrap mathematical expressions, variables, and equations in '$' delimiters.
   - Use '$' for inline math (e.g., "$x^2$", "$\\frac{1}{2}$", "$\\sqrt{3}$").
   - Use '$$' for block math (e.g., "$$ \\int_0^\\infty f(x) dx $$").
   - **NEVER** output plain LaTeX without delimiters (e.g., DO NOT write "\sqrt{3}" or "x^2" or "2 + 2i\sqrt{3}" without wrapping them in $...$).
   - **JSON ESCAPING**: You MUST double-escape all backslashes in strings. 
     - Correct: "$ \\\\sqrt{3} $" becomes JSON string "$\\\\sqrt{3}$".
     - Incorrect: "\sqrt{3}".

# STYLE GUIDELINES
- Use clear, simple teaching language.
- Prefer intuition + logic.
`;

// Helper to clean and parse JSON potentially containing markdown or bad escapes
const cleanAndParseJSON = (text: string): DoubtSolverResponse => {
  // 1. Remove Markdown code blocks (```json ... ```)
  let cleanText = text.replace(/```json\s*/g, "").replace(/```\s*$/, "");

  // 2. Attempt to parse
  try {
    return JSON.parse(cleanText) as DoubtSolverResponse;
  } catch (firstError) {
    console.warn("First JSON parse attempt failed, trying to sanitize LaTeX escapes...", firstError);
    
    // 3. Fallback: Heuristic repair for common LaTeX escape issues
    cleanText = cleanText.replace(/\\([^"\\/bfnrtu])/g, "\\\\$1");

    try {
      return JSON.parse(cleanText) as DoubtSolverResponse;
    } catch (secondError) {
      console.error("Failed to parse JSON even after sanitization:", cleanText);
      throw new Error("The AI response was not valid JSON. Please try again.");
    }
  }
};

export const analyzeImage = async (
  base64Image: string,
  mode: SolverMode,
  language: string
): Promise<DoubtSolverResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Clean base64 string if it contains metadata header
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const userContext = JSON.stringify({
    mode: mode,
    user_language: language,
    instruction: `Analyze in '${mode}' mode. CRITICAL: Wrap ALL math symbols in $ or $$ delimiters.`
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          { text: `Context: ${userContext}` },
          {
            inlineData: {
              mimeType: "image/png", 
              data: cleanBase64,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        temperature: 0.2, 
      },
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    return cleanAndParseJSON(response.text);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};