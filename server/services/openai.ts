import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface QuizGenerationRequest {
  topic: string;
  questionsCount: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface GeneratedQuiz {
  title: string;
  questions: GeneratedQuestion[];
}

export async function generateQuiz(request: QuizGenerationRequest): Promise<GeneratedQuiz> {
  try {
    const systemPrompt = `You are an expert quiz creator. Generate high-quality educational quiz questions that are engaging, clear, and educational. Always respond with valid JSON.`;

    const prompt = `Generate a comprehensive quiz about "${request.topic}". 
    
Requirements:
- Create exactly ${request.questionsCount} multiple choice questions
- Each question should have exactly 4 options (A, B, C, D)
- Questions should be ${request.difficulty || 'medium'} difficulty level
- Cover different aspects of the topic
- Include a mix of factual, conceptual, and application questions
- Provide clear, unambiguous questions and answers

Return the response in JSON format with this exact structure:
{
  "title": "Quiz title based on the topic",
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Note: correctAnswer should be the index (0-3) of the correct option in the options array.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 4,
                    maxItems: 4
                  },
                  correctAnswer: { type: "number", minimum: 0, maximum: 3 },
                  explanation: { type: "string" }
                },
                required: ["question", "options", "correctAnswer"]
              }
            }
          },
          required: ["title", "questions"]
        }
      },
      contents: prompt,
    });

    const content = response.text;
    if (!content) {
      throw new Error("No content received from Gemini");
    }

    const quiz = JSON.parse(content) as GeneratedQuiz;
    
    // Validate the response structure
    if (!quiz.title || !quiz.questions || !Array.isArray(quiz.questions)) {
      throw new Error("Invalid quiz structure received from Gemini");
    }

    if (quiz.questions.length !== request.questionsCount) {
      throw new Error(`Expected ${request.questionsCount} questions, but got ${quiz.questions.length}`);
    }

    // Validate each question
    for (const question of quiz.questions) {
      if (!question.question || !question.options || question.options.length !== 4) {
        throw new Error("Invalid question structure");
      }
      if (question.correctAnswer < 0 || question.correctAnswer > 3) {
        throw new Error("Invalid correct answer index");
      }
    }

    return quiz;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error(`Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
