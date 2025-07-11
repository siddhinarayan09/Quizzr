import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer } from "@/components/timer";
import { ResultsChart } from "@/components/results-chart";
import { FinalDashboard } from "@/components/final-dashboard";
import { useWebSocket } from "@/hooks/use-websocket";
import { Pause, RotateCcw, ArrowRight, Play, Users, Clock, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { QuizWithQuestions, QuizStats, Response, ParticipantRanking } from "@shared/schema";

interface PresenterDashboardProps {
  quizId: string;
}

export default function PresenterDashboard({ quizId }: PresenterDashboardProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [rankings, setRankings] = useState<ParticipantRanking[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch quiz data
  const { data: quiz, isLoading } = useQuery<QuizWithQuestions>({
    queryKey: [`/api/quiz/${quizId}`],
    enabled: Boolean(quizId),
  });

  // Fetch quiz stats
  const { data: stats } = useQuery<QuizStats>({
    queryKey: [`/api/quiz/${quizId}/stats`, currentQuestionIndex],
    enabled: Boolean(quizId && quiz?.questions?.[currentQuestionIndex]),
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // WebSocket for real-time updates
  const { sendMessage, isConnected } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'participant_joined':
          queryClient.invalidateQueries({ queryKey: [`/api/quiz/${quizId}/stats`] });
          toast({
            title: "New Participant",
            description: `${message.participant.name} joined the quiz`,
          });
          break;
        case 'answer_submitted':
          if (message.questionId === quiz?.questions?.[currentQuestionIndex]?.id) {
            setResponses(message.responses);
            queryClient.invalidateQueries({ queryKey: [`/api/quiz/${quizId}/stats`] });
          }
          break;
        case 'quiz_completed':
          setIsQuizActive(false);
          setIsTimerActive(false);
          setIsQuizCompleted(true);
          setRankings(message.rankings);
          toast({
            title: "Quiz Completed!",
            description: "Showing final results...",
          });
          break;
      }
    },
    onConnect: () => {
      if (quizId) {
        sendMessage({
          type: 'join_room',
          quizId: parseInt(quizId),
          role: 'presenter'
        });
      }
    }
  });

  const startQuizMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/quiz/${quizId}/start`, {}),
    onSuccess: () => {
      setIsQuizActive(true);
      setIsTimerActive(true);
      toast({
        title: "Quiz Started!",
        description: "Participants can now answer questions.",
      });
    },
  });

  const nextQuestionMutation = useMutation({
    mutationFn: (questionIndex: number) => 
      apiRequest('POST', `/api/quiz/${quizId}/next`, { questionIndex }),
    onSuccess: () => {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsTimerActive(true);
      setResponses([]);
      toast({
        title: "Next Question",
        description: "Moving to the next question.",
      });
    },
  });

  const endQuizMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/quiz/${quizId}/end`, {}),
    onSuccess: () => {
      setIsQuizActive(false);
      setIsTimerActive(false);
      toast({
        title: "Quiz Completed!",
        description: "Showing final results...",
      });
    },
  });

  const currentQuestion = quiz?.questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= (quiz?.questions?.length || 0) - 1;


  //debug
  console.log("Current Question:", currentQuestion);
  console.log("Responses:", responses);


  // Calculate response data for chart
  const chartData = currentQuestion?.options.map((option, index) => {
    const count = responses.filter(r => r.selectedAnswer === index).length;
    const percentage = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;
    return {
      option: `${String.fromCharCode(65 + index)} - ${option.substring(0, 20)}${option.length > 20 ? '...' : ''}`,
      count,
      percentage,
    };
  }) || [];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!quiz) {
    return <div className="text-center">Quiz not found</div>;
  }

  //debug
  console.log("Chart Data:", chartData);

  // Show final dashboard if quiz is completed
  if (isQuizCompleted) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <FinalDashboard rankings={rankings} isPresenter={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
              <p className="text-gray-600 mt-1">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Room Code */}
              <div className="bg-gray-50 px-4 py-2 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Room Code</p>
                <p className="text-xl font-mono font-bold text-primary">{quiz.roomCode}</p>
              </div>
              {/* Participants */}
              <div className="bg-gray-50 px-4 py-2 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Participants</p>
                <p className="text-xl font-bold text-green-600">{stats?.totalParticipants || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Quiz Interface */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Question Display */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Card */}
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Current Question</h3>
                {/* Timer */}
                <Timer
                  duration={quiz.timePerQuestion}
                  isActive={isTimerActive}
                  resetKey={currentQuestionIndex}
                  onComplete={() => {
                    setIsTimerActive(false);
                    // Auto-advance to next question or end quiz
                    if (currentQuestionIndex < quiz.questions.length - 1) {
                      // Move to next question
                      setTimeout(() => {
                        nextQuestionMutation.mutate(currentQuestionIndex + 1);
                      }, 2000); // second delay to show results
                    } else {
                      // End quiz
                      setTimeout(() => {
                        setIsQuizActive(false);
                        endQuizMutation.mutate();
                      }, 2000);
                    }
                  }}
                />
              </div>
              
              <div className="space-y-6">
                <h4 className="text-xl font-semibold text-gray-900">
                  {currentQuestion?.questionText}
                </h4>
                
                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion?.options.map((option, index) => {
                    const responseCount = responses.filter(r => r.selectedAnswer === index).length;
                    const percentage = responses.length > 0 ? Math.round((responseCount / responses.length) * 100) : 0;
                    const isCorrect = index === currentQuestion.correctAnswer;
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 border-2 rounded-lg ${
                          isCorrect ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                            isCorrect ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="font-medium">{option}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {responseCount > 0 && (
                            <div className={`w-2 h-2 rounded-full ${
                              isCorrect ? 'bg-green-600' : 'bg-primary'
                            } animate-pulse`} />
                          )}
                          <span className={`text-sm font-semibold ${
                            isCorrect ? 'text-green-700' : 'text-primary'
                          }`}>
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {!isQuizActive ? (
                    <Button
                      onClick={() => startQuizMutation.mutate()}
                      disabled={startQuizMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Quiz
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newIsActive = !isTimerActive;
                          setIsTimerActive(newIsActive);
                          sendMessage({
                            type: newIsActive ? 'resume_timer' : 'pause_timer',
                          });
                        }}
                      >
                        
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    Responses: <span className="font-semibold text-gray-900">
                      {responses.length}/{stats?.totalParticipants || 0}
                    </span>
                  </span>
                  {isQuizActive && !isLastQuestion && (
                    <Button
                      onClick={() => nextQuestionMutation.mutate(currentQuestionIndex + 1)}
                      disabled={nextQuestionMutation.isPending}
                    >
                      Next Question <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  {isLastQuestion && (
                    <Button 
                      variant="outline"
                      onClick={() => endQuizMutation.mutate()}
                      disabled={endQuizMutation.isPending}
                    >
                      End Quiz
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Live Results Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-black/100">Live Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {chartData.length > 0 ? (
                  <ResultsChart data={chartData} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Waiting for responses...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-black">Quiz Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                </div>
                <span className="font-semibold">
                  {stats?.averageResponseTime ? `${stats.averageResponseTime.toFixed(1)}s` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Correct Rate</span>
                </div>
                <Badge variant={stats?.correctRate && stats.correctRate > 70 ? "default" : "secondary"}>
                  {stats?.correctRate ? `${stats.correctRate.toFixed(0)}%` : 'N/A'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Active Participants</span>
                </div>
                <span className="font-semibold text-green-600">
                  {stats?.activeParticipants || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
