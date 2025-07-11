import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  questionsCount: integer("questions_count").notNull().default(10),
  timePerQuestion: integer("time_per_question").notNull().default(30),
  roomCode: text("room_code").notNull().unique(),
  isActive: boolean("is_active").notNull().default(false),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  questionText: text("question_text").notNull(),
  options: jsonb("options").notNull().$type<string[]>(),
  correctAnswer: integer("correct_answer").notNull(),
  order: integer("order").notNull(),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  name: text("name").notNull(),
  isConnected: boolean("is_connected").notNull().default(true),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id").notNull().references(() => participants.id),
  questionId: integer("question_id").notNull().references(() => questions.id),
  selectedAnswer: integer("selected_answer").notNull(),
  responseTime: integer("response_time").notNull(), // in seconds
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Insert schemas
export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  roomCode: true,
  isActive: true,
  currentQuestionIndex: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  quizId: true,
  isConnected: true,
  joinedAt: true,
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  submittedAt: true,
});

// Types
export type Quiz = typeof quizzes.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Response = typeof responses.$inferSelect;

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type InsertResponse = z.infer<typeof insertResponseSchema>;

// Extended types
export type QuizWithQuestions = Quiz & {
  questions: Question[];
};

export type QuestionWithResponses = Question & {
  responses: Response[];
};

export type QuizStats = {
  totalParticipants: number;
  activeParticipants: number;
  currentResponses: number;
  averageResponseTime: number;
  correctRate: number;
};

export type ParticipantRanking = {
  participantId: number;
  participantName: string;
  correctAnswers: number;
  totalQuestions: number;
  averageResponseTime: number;
  rank: number;
  score: number; // percentage of correct answers
};
