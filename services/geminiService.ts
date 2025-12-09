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
   - **For Chemical Equations**: Use LaTeX math mode with \\mathrm or \\text (e.g., "$\\mathrm{2H_2 + O_2 \\rightarrow 2H_2O}$").
   - **For Physics Formulas**: Use standard LaTeX (e.g., "$F = ma$", "$E = mc^2$").
   - **NEVER** output plain LaTeX without delimiters (e.g., DO NOT write "\\sqrt{3}" or "x^2" or "2 + 2i\\sqrt{3}" without wrapping them in $...$).
   - **JSON ESCAPING**: You MUST double-escape all backslashes in strings. 
     - Correct: "$ \\\\sqrt{3} $" becomes JSON string "$\\\\sqrt{3}$".
     - Incorrect: "\\sqrt{3}".

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
  // Check if header exists
  const match = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  // Fallback: assume png if no header (common in some drag-drop libs), or returns raw if it was already raw
  return { mimeType: 'image/png', data: base64String.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "") };
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
  
  // Use robust parser
  const { mimeType, data } = parseBase64(base64Image);

  const userContext = JSON.stringify({
    mode: mode,
    user_language: language,
    instruction: `Analyze in '${mode}' mode. CRITICAL: Wrap ALL math symbols in $ or $$ delimiters. Use LaTeX for Chemistry/Physics.`
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
              mimeType: mimeType, 
              data: data,
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

// --- VISUAL SOLUTION SERVICE ---
export const generateVisualSolution = async (base64Image: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use robust parser to ensure we send the correct MIME type (e.g. jpeg vs png)
  // RPC errors often happen if we claim it's PNG but send JPEG bytes.
  const { mimeType, data } = parseBase64(base64Image);

  try {
    const response = await ai.models.generateContent({
      // Using Pro model for superior image editing and text generation capabilities
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: data,
              mimeType: mimeType,
            },
          },
          {
            text: `You are an expert Math Tutor with perfect handwriting. 
            Task: Solve the math problem shown in the image.
            Action: Generate a new image that overlays the step-by-step solution onto the original image.
            
            STRICT GUIDELINES:
            1. **SPELLING MUST BE PERFECT**. Check every word twice. No typos allowed.
            2. Use **High-Contrast** digital ink (Cyan, Neon Green, or Bright Yellow) so it stands out vividly.
            3. Write **clearly and legibly**. The text must be professional and easy to read.
            4. **Number each step** (1, 2, 3...) of the solution clearly.
            5. **Box the final answer** at the end.
            6. Use whitespace effectively; do not obscure the original question if possible.
            
            Return only the edited image with the full, correctly spelled solution written on it.`,
          },
        ],
      },
    });

    // Extract generated image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Visual solution error details:", e);
    throw new Error("Failed to generate visual solution. Please try again or use a smaller image.");
  }

  throw new Error("No visual solution generated");
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
      2. For chemical equations use $\\mathrm{...}$ syntax.
      3. Do not just give answers; guide the student.
      4. Be concise and encouraging.
      `,
    }
  });
};

// --- AUDIO SERVICE (TTS) ---

// Helper to decode Base64 string to Uint8Array
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert Raw PCM data (Int16) to AudioBuffer
// Gemini TTS model returns raw PCM at 24kHz
async function pcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
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
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBytes = decodeBase64(base64Audio);
  
  // Use the PCM decoder logic
  return await pcmToAudioBuffer(audioBytes, audioContext, 24000, 1);
};