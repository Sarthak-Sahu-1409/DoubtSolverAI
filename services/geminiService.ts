
import { GoogleGenAI, Modality } from "@google/genai";
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
  "alternative_methods": [
    {
      "method_name": "e.g., Geometric Approach",
      "description": "",
      "steps": [
         { "step_number": 1, "title": "", "content": "", "concepts_applied": [] }
      ]
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
   - **mode = "learning"**: Provide detailed "step_by_step_solution" AND populate "alternative_methods" if applicable (e.g. algebraic vs geometric). Full "theory", "flashcards", and "teacher_notes".
   - **mode = "exam"**: Provide ONLY the "short_answer" and 1-2 very concise steps in "step_by_step_solution". DO NOT fill theory or flashcards.
   - **mode = "hint"**: Populate "hints_only" with 3-5 progressive hints. DO NOT provide the "short_answer" or "step_by_step_solution".
   - **mode = "revision"**: In "step_by_step_solution", list ONLY the formulas and theorems used, not the calculation steps. Populate "flashcards".

4. If the image is unclear, make reasonable assumptions and mention them.
5. Tailor explanations to the student's level.
6. Use the selected user_language for all text.

7. **CRITICAL: MATH & LATEX FORMATTING**
   - **ALWAYS** wrap mathematical expressions, variables, and equations in '$' delimiters.
   - Use '$' for inline math (e.g., "$x^2$", "$\\frac{1}{2}$", "$\\sqrt{3}$").
   - Use '$$' for block math (e.g., "$$ \\int_0^\\infty f(x) dx $$").
   - **DO NOT** use "\\(" or "\\[" delimiters. Use ONLY dollars.
   - **DO NOT** put spaces between the dollar sign and the math. (Correct: "$x+y$". Incorrect: "$ x+y $").
   - **For Chemical Equations**: Use LaTeX math mode with \\mathrm or \\text (e.g., "$\\mathrm{2H_2 + O_2 \\rightarrow 2H_2O}$").
   - **For Physics Formulas**: Use standard LaTeX (e.g., "$F = ma$", "$E = mc^2$").
   - **NEVER** output plain LaTeX without delimiters (e.g., DO NOT write "\\sqrt{3}" or "x^2" or "2 + 2i\\sqrt{3}" without wrapping them in $...$).
   - **JSON ESCAPING (EXTREMELY IMPORTANT)**: 
     - You are outputting a JSON string. You MUST double-escape all backslashes.
     - To produce the LaTeX output $\\frac{1}{2}$, your JSON string must be "$\\\\frac{1}{2}$".
     - To produce $\\sqrt{x}$, your JSON string must be "$\\\\sqrt{x}$".
     - Failure to double-escape will result in invalid JSON.

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

// Helper to reliably extract mime type and data from base64 string
const parseBase64 = (base64String: string) => {
  const match = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'image/png', data: base64String.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "") };
};

export const analyzeImage = async (
  base64Image: string,
  mode: SolverMode,
  language: string
): Promise<DoubtSolverResponse> => {
  if (!process.env.API_KEY) throw new Error("API Key not found");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { mimeType, data } = parseBase64(base64Image);

  const userContext = JSON.stringify({
    mode: mode,
    user_language: language,
    instruction: `Analyze in '${mode}' mode. CRITICAL: Wrap ALL math symbols in $ or $$ delimiters. Try to provide 'alternative_methods' if possible.`
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          { text: `Context: ${userContext}` },
          { inlineData: { mimeType: mimeType, data: data } },
        ],
      },
      config: { responseMimeType: "application/json", temperature: 0.2 },
    });
    if (!response.text) throw new Error("No response from Gemini");
    return cleanAndParseJSON(response.text);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

// --- VISUAL SOLUTION SERVICE ---
export const generateVisualSolution = async (base64Image: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { mimeType, data } = parseBase64(base64Image);

  // ENHANCED PROMPT FOR BETTER VISUAL OUTPUT
  const prompt = `
  You are an expert Math Tutor. Create a comprehensive "Visual Solution Card" based on the problem in this image.
  
  Directives:
  1. **Canvas**: Generate a high-resolution image that looks like a neat, organized page of notes or a digital whiteboard.
  2. **Structure**:
     - **Top Section**: Rewrite the question clearly at the top (so context is preserved).
     - **Middle Section**: Show the step-by-step mathematical working. Use arrows to show the flow.
     - **Bottom Section**: Box the final answer clearly in a distinct color (e.g., Red or Green).
  3. **Styling**:
     - Use a handwriting style that is large and extremely legible.
     - **Color Coding**: Use **Blue** for main steps, **Black** for text, **Red** for the answer/warnings.
     - If the original image had a diagram, redraw a clearer, labeled version of it next to the solution.
  4. **Goal**: The student should look at this image and instantly understand how to solve the problem without needing to read a wall of text. It should look like a "Cheat Sheet" for this problem.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: data, mimeType: mimeType } },
          { text: prompt },
        ],
      },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No visual solution generated");
  } catch (e) {
    throw e;
  }
};

// --- CHAT SERVICE ---
export const createTutorChat = (historyContext: any) => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are a patient, Socratic AI Tutor. 
      The user is asking about a specific problem they just solved.
      Context: ${JSON.stringify(historyContext)}
      RULES:
      1. Use Markdown for all math (wrap in $ or $$).
      2. Do not just give answers; guide the student.
      `,
    }
  });
};

// --- AUDIO SERVICE (TTS) ---
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function pcmToAudioBuffer(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

export const generateAudioExplanation = async (textToSpeak: string): Promise<AudioBuffer> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: textToSpeak }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return await pcmToAudioBuffer(decodeBase64(base64Audio), audioContext);
};

// --- VIDEO SERVICE (Veo) ---
export const generateConceptVideo = async (data: DoubtSolverResponse): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const stepsDescription = data.step_by_step_solution
    .map(step => `Step ${step.step_number} (${step.title}): ${step.content.replace(/[$]/g, '')}`)
    .join('. ');

  const prompt = `Cinematic, educational 3D visualization showing: ${data.question_understanding.detected_subject}. 
  Visualizing steps: ${stepsDescription.substring(0, 800)}. High quality, scientific, neutral background.`;

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }
  return `${operation.response?.generatedVideos?.[0]?.video?.uri}&key=${process.env.API_KEY}`;
};

export const generateVideoTranscription = async (data: DoubtSolverResponse): Promise<string[]> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const steps = data.step_by_step_solution.map(s => `Step ${s.step_number}: ${s.content}`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [{
        text: `Create a concise narration script for this problem. Split into short sentence segments.
        Topic: ${data.question_understanding.detected_subject}
        Steps: ${steps}
        Output strictly a JSON array of strings.`
      }]
    },
    config: { responseMimeType: "application/json" }
  });

  try { return JSON.parse(response.text || "[]") as string[]; } 
  catch (e) { return ["Transcription unavailable."]; }
};

// --- STUDENT CHECKER & EXAM GENERATOR ---

export const checkStudentAttempt = async (
  question: string,
  correctSolution: string,
  studentAttempt: string
): Promise<{ correct: boolean; feedback: string; correction: string }> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [{
        text: `You are a strict but helpful math teacher.
        Question: ${question}
        Correct Solution: ${correctSolution}
        Student Attempt: ${studentAttempt}

        Analyze the student's work. Find the specific line where they made a mistake (if any).
        Output JSON:
        {
          "correct": boolean,
          "feedback": "Encouraging feedback pointing out the logic error",
          "correction": "The corrected math for that specific step using LaTeX ($...$)"
        }`
      }]
    },
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text || "{}");
};

export const generatePracticeExam = async (topic: string, level: string): Promise<any> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [{
        text: `Generate a mini practice exam for topic: "${topic}" at level: "${level}".
        Create 3 questions (1 Easy, 1 Medium, 1 Hard).
        Output JSON:
        {
          "title": "Practice Exam: ${topic}",
          "questions": [
            { "id": 1, "difficulty": "Easy", "text": "...", "answer": "..." },
            { "id": 2, "difficulty": "Medium", "text": "...", "answer": "..." },
            { "id": 3, "difficulty": "Hard", "text": "...", "answer": "..." }
          ]
        }`
      }]
    },
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text || "{}");
};
