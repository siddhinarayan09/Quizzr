import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { generateQuiz } from "./services/gemini";
import { insertQuizSchema, insertParticipantSchema, insertResponseSchema } from "@shared/schema";
import { z } from "zod";

interface WebSocketClient extends WebSocket {
  quizId?: number;
  participantId?: number;
  role?: 'presenter' | 'participant';
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocketClient>();

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocketClient) => {
    clients.add(ws);
    console.log('Client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        await handleWebSocketMessage(ws, data, clients);
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected');
    });
  });

  // API Routes

  // Create quiz with AI generation
  app.post('/api/quiz/generate', async (req, res) => {
    try {
      const { topic, title, questionsCount, timePerQuestion, difficulty } = req.body;
      
      if (!topic || !title) {
        return res.status(400).json({ message: 'Topic and title are required' });
      }

      // Generate quiz using OpenAI
      const generatedQuiz = await generateQuiz({
        topic,
        questionsCount: questionsCount || 10,
        difficulty: difficulty || 'medium'
      });

      // Create quiz in storage
      const quiz = await storage.createQuiz({
        title: title,
        description: topic,
        questionsCount: questionsCount || 10,
        timePerQuestion: timePerQuestion || 30,
      });

      // Create questions
      const questions = await storage.createQuestions(
        generatedQuiz.questions.map((q, index) => ({
          quizId: quiz.id,
          questionText: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          order: index
        }))
      );

      const quizWithQuestions = await storage.getQuizWithQuestions(quiz.id);
      res.json(quizWithQuestions);
    } catch (error) {
      console.error('Quiz generation error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to generate quiz' 
      });
    }
  });

  // Get quiz by ID (for presenter dashboard)
  app.get('/api/quiz/:id(\\d+)', async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const quizWithQuestions = await storage.getQuizWithQuestions(quizId);
      
      if (!quizWithQuestions) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      res.json(quizWithQuestions);
    } catch (error) {
      console.error('Get quiz by ID error:', error);
      res.status(500).json({ message: 'Failed to get quiz' });
    }
  });

  // Get quiz by room code (for students joining)
  app.get('/api/quiz/:roomCode', async (req, res) => {
    try {
      const { roomCode } = req.params;
      const quiz = await storage.getQuizByRoomCode(roomCode);
      
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      const quizWithQuestions = await storage.getQuizWithQuestions(quiz.id);
      res.json(quizWithQuestions);
    } catch (error) {
      console.error('Get quiz by room code error:', error);
      res.status(500).json({ message: 'Failed to get quiz' });
    }
  });

  // Join quiz as participant
  app.post('/api/quiz/:roomCode/join', async (req, res) => {
    try {
      const { roomCode } = req.params;
      const participantData = insertParticipantSchema.parse(req.body);

      const quiz = await storage.getQuizByRoomCode(roomCode);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      const participant = await storage.createParticipant({
        ...participantData,
        quizId: quiz.id,
      });

      // Notify all clients about new participant
      broadcastToQuiz(clients, quiz.id, {
        type: 'participant_joined',
        participant,
      });

      res.json({ participant, quiz });
    } catch (error) {
      console.error('Join quiz error:', error);
      res.status(400).json({ message: 'Failed to join quiz' });
    }
  });

  // Start quiz
  app.post('/api/quiz/:id/start', async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      await storage.updateQuizStatus(quizId, true);
      
      // Notify all participants that quiz has started
      broadcastToQuiz(clients, quizId, {
        type: 'quiz_started',
        currentQuestionIndex: 0,
      });

      res.json({ message: 'Quiz started' });
    } catch (error) {
      console.error('Start quiz error:', error);
      res.status(500).json({ message: 'Failed to start quiz' });
    }
  });

  // Next question
  app.post('/api/quiz/:id/next', async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const { questionIndex } = req.body;
      
      await storage.updateCurrentQuestion(quizId, questionIndex);
      
      // Notify all participants about next question
      broadcastToQuiz(clients, quizId, {
        type: 'next_question',
        currentQuestionIndex: questionIndex,
      });

      res.json({ message: 'Question updated' });
    } catch (error) {
      console.error('Next question error:', error);
      res.status(500).json({ message: 'Failed to update question' });
    }
  });

  // End quiz
  app.post('/api/quiz/:id/end', async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      
      // Update quiz status to inactive
      await storage.updateQuizStatus(quizId, false);
      
      // Get final rankings
      const rankings = await storage.getQuizRankings(quizId);
      
      // Broadcast quiz completion to all clients
      broadcastToQuiz(clients, quizId, {
        type: 'quiz_completed',
        rankings: rankings,
      });

      res.json({ message: 'Quiz ended', rankings });
    } catch (error) {
      console.error('End quiz error:', error);
      res.status(500).json({ message: 'Failed to end quiz' });
    }
  });

  // Submit answer
  app.post('/api/response', async (req, res) => {
    try {
      const responseData = insertResponseSchema.parse(req.body);
      const response = await storage.createResponse(responseData);
      
      // Get the question to find quiz ID
      const question = await storage.getQuestion(responseData.questionId);
      if (question) {
        // Broadcast updated results to all clients
        const questionWithResponses = await storage.getQuestionWithResponses(responseData.questionId);
        broadcastToQuiz(clients, question.quizId, {
          type: 'answer_submitted',
          questionId: responseData.questionId,
          responses: questionWithResponses?.responses || [],
        });
      }

      res.json(response);
    } catch (error) {
      console.error('Submit response error:', error);
      res.status(400).json({ message: 'Failed to submit response' });
    }
  });

  // Get quiz stats
  app.get('/api/quiz/:id/stats', async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const questionId = req.query.questionId ? parseInt(req.query.questionId as string) : undefined;
      
      const stats = await storage.getQuizStats(quizId, questionId);
      res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ message: 'Failed to get stats' });
    }
  });

  return httpServer;
}

// WebSocket message handler
async function handleWebSocketMessage(ws: WebSocketClient, data: any, clients: Set<WebSocketClient>) {
  try {
    switch (data.type) {
      case 'join_room':
        ws.quizId = data.quizId;
        ws.participantId = data.participantId;
        ws.role = data.role || 'participant';
        break;
      
      case 'pause_timer':
      case 'resume_timer':
        if (ws.quizId) {
          broadcastToQuiz(clients, ws.quizId, {
            type: data.type
          });
        }
        break;
      
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
        
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  } catch (error) {
    console.error('WebSocket handler error:', error);
  }
}

// Broadcast message to all clients in a specific quiz
function broadcastToQuiz(clients: Set<WebSocketClient>, quizId: number, message: any) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.quizId === quizId && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}
