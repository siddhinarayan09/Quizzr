import { 
  quizzes, 
  questions, 
  participants, 
  responses,
  type Quiz, 
  type Question, 
  type Participant, 
  type Response,
  type InsertQuiz, 
  type InsertQuestion, 
  type InsertParticipant, 
  type InsertResponse,
  type QuizWithQuestions,
  type QuestionWithResponses,
  type QuizStats,
  type ParticipantRanking
} from "@shared/schema";

export interface IStorage {
  // Quiz operations
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuizByRoomCode(roomCode: string): Promise<Quiz | undefined>;
  getQuizWithQuestions(id: number): Promise<QuizWithQuestions | undefined>;
  updateQuizStatus(id: number, isActive: boolean): Promise<void>;
  updateCurrentQuestion(id: number, questionIndex: number): Promise<void>;
  
  // Question operations
  createQuestions(questions: InsertQuestion[]): Promise<Question[]>;
  getQuestionsByQuizId(quizId: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  
  // Participant operations
  createParticipant(participant: InsertParticipant & { quizId: number }): Promise<Participant>;
  getParticipantsByQuizId(quizId: number): Promise<Participant[]>;
  updateParticipantConnection(id: number, isConnected: boolean): Promise<void>;
  
  // Response operations
  createResponse(response: InsertResponse): Promise<Response>;
  getResponsesByQuestionId(questionId: number): Promise<Response[]>;
  getQuestionWithResponses(questionId: number): Promise<QuestionWithResponses | undefined>;
  
  // Stats operations
  getQuizStats(quizId: number, questionId?: number): Promise<QuizStats>;
  getQuizRankings(quizId: number): Promise<ParticipantRanking[]>;
}

export class MemStorage implements IStorage {
  private quizzes: Map<number, Quiz>;
  private questions: Map<number, Question>;
  private participants: Map<number, Participant>;
  private responses: Map<number, Response>;
  private currentQuizId: number;
  private currentQuestionId: number;
  private currentParticipantId: number;
  private currentResponseId: number;

  constructor() {
    this.quizzes = new Map();
    this.questions = new Map();
    this.participants = new Map();
    this.responses = new Map();
    this.currentQuizId = 1;
    this.currentQuestionId = 1;
    this.currentParticipantId = 1;
    this.currentResponseId = 1;
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const roomCode = this.generateRoomCode();
    const quiz: Quiz = {
      id: this.currentQuizId++,
      title: insertQuiz.title,
      description: insertQuiz.description,
      questionsCount: insertQuiz.questionsCount || 10,
      timePerQuestion: insertQuiz.timePerQuestion || 30,
      roomCode,
      isActive: false,
      currentQuestionIndex: 0,
      createdAt: new Date(),
    };
    this.quizzes.set(quiz.id, quiz);
    return quiz;
  }

  async getQuizByRoomCode(roomCode: string): Promise<Quiz | undefined> {
    return Array.from(this.quizzes.values()).find(quiz => quiz.roomCode === roomCode);
  }

  async getQuizWithQuestions(id: number): Promise<QuizWithQuestions | undefined> {
    const quiz = this.quizzes.get(id);
    if (!quiz) return undefined;
    
    const questions = Array.from(this.questions.values())
      .filter(q => q.quizId === id)
      .sort((a, b) => a.order - b.order);
      
    return { ...quiz, questions };
  }

  async updateQuizStatus(id: number, isActive: boolean): Promise<void> {
    const quiz = this.quizzes.get(id);
    if (quiz) {
      this.quizzes.set(id, { ...quiz, isActive });
    }
  }

  async updateCurrentQuestion(id: number, questionIndex: number): Promise<void> {
    const quiz = this.quizzes.get(id);
    if (quiz) {
      this.quizzes.set(id, { ...quiz, currentQuestionIndex: questionIndex });
    }
  }

  async createQuestions(insertQuestions: InsertQuestion[]): Promise<Question[]> {
    const questions: Question[] = [];
    for (const insertQuestion of insertQuestions) {
      const question: Question = {
        id: this.currentQuestionId++,
        quizId: insertQuestion.quizId,
        questionText: insertQuestion.questionText,
        options: insertQuestion.options as string[],
        correctAnswer: insertQuestion.correctAnswer,
        order: insertQuestion.order,
      };
      this.questions.set(question.id, question);
      questions.push(question);
    }
    return questions;
  }

  async getQuestionsByQuizId(quizId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.quizId === quizId)
      .sort((a, b) => a.order - b.order);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createParticipant(insertParticipant: InsertParticipant & { quizId: number }): Promise<Participant> {
    const participant: Participant = {
      id: this.currentParticipantId++,
      name: insertParticipant.name,
      quizId: insertParticipant.quizId,
      isConnected: true,
      joinedAt: new Date(),
    };
    this.participants.set(participant.id, participant);
    return participant;
  }

  async getParticipantsByQuizId(quizId: number): Promise<Participant[]> {
    return Array.from(this.participants.values())
      .filter(p => p.quizId === quizId);
  }

  async updateParticipantConnection(id: number, isConnected: boolean): Promise<void> {
    const participant = this.participants.get(id);
    if (participant) {
      this.participants.set(id, { ...participant, isConnected });
    }
  }

  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const response: Response = {
      ...insertResponse,
      id: this.currentResponseId++,
      submittedAt: new Date(),
    };
    this.responses.set(response.id, response);
    return response;
  }

  async getResponsesByQuestionId(questionId: number): Promise<Response[]> {
    return Array.from(this.responses.values())
      .filter(r => r.questionId === questionId);
  }

  async getQuestionWithResponses(questionId: number): Promise<QuestionWithResponses | undefined> {
    const question = this.questions.get(questionId);
    if (!question) return undefined;
    
    const responses = await this.getResponsesByQuestionId(questionId);
    return { ...question, responses };
  }

  async getQuizStats(quizId: number, questionId?: number): Promise<QuizStats> {
    const participants = await this.getParticipantsByQuizId(quizId);
    const totalParticipants = participants.length;
    const activeParticipants = participants.filter(p => p.isConnected).length;
    
    let currentResponses = 0;
    let averageResponseTime = 0;
    let correctRate = 0;
    
    if (questionId) {
      const responses = await this.getResponsesByQuestionId(questionId);
      const question = await this.getQuestion(questionId);
      
      currentResponses = responses.length;
      
      if (responses.length > 0) {
        averageResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
        
        if (question) {
          const correctResponses = responses.filter(r => r.selectedAnswer === question.correctAnswer).length;
          correctRate = (correctResponses / responses.length) * 100;
        }
      }
    }
    
    return {
      totalParticipants,
      activeParticipants,
      currentResponses,
      averageResponseTime,
      correctRate,
    };
  }

  async getQuizRankings(quizId: number): Promise<ParticipantRanking[]> {
    const participants = Array.from(this.participants.values())
      .filter(p => p.quizId === quizId);
    
    const quizQuestions = Array.from(this.questions.values())
      .filter(q => q.quizId === quizId);
    
    const rankings: ParticipantRanking[] = [];
    
    for (const participant of participants) {
      let correctAnswers = 0;
      let totalResponseTime = 0;
      let responseCount = 0;
      
      // Get all responses for this participant
      for (const question of quizQuestions) {
        const response = Array.from(this.responses.values())
          .find(r => r.participantId === participant.id && r.questionId === question.id);
        
        if (response) {
          responseCount++;
          totalResponseTime += response.responseTime;
          
          // Check if answer is correct
          if (response.selectedAnswer === question.correctAnswer) {
            correctAnswers++;
          }
        }
      }
      
      const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
      const score = quizQuestions.length > 0 ? Math.round((correctAnswers / quizQuestions.length) * 100) : 0;
      
      rankings.push({
        participantId: participant.id,
        participantName: participant.name,
        correctAnswers,
        totalQuestions: quizQuestions.length,
        averageResponseTime,
        rank: 0, // Will be set after sorting
        score
      });
    }
    
    // Sort by correct answers (descending), then by average response time (ascending)
    rankings.sort((a, b) => {
      if (a.correctAnswers !== b.correctAnswers) {
        return b.correctAnswers - a.correctAnswers;
      }
      return a.averageResponseTime - b.averageResponseTime;
    });
    
    // Assign ranks
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });
    
    return rankings;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const storage = new MemStorage();
