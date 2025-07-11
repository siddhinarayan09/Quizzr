import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "@/components/timer";
import { FinalDashboard } from "@/components/final-dashboard";
import { useWebSocket } from "@/hooks/use-websocket";
import { Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { QuizWithQuestions, Participant, ParticipantRanking } from "@shared/schema";

interface StudentInterfaceProps {
  quizId: string;
}

export default function StudentInterface({ quizId }: StudentInterfaceProps) {
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [rankings, setRankings] = useState<ParticipantRanking[]>([]);
  const { toast } = useToast();

  // Get participant info from localStorage
  useEffect(() => {
    const storedParticipant = localStorage.getItem('participant');
    if (storedParticipant) {
      setParticipant(JSON.parse(storedParticipant));
    }
  }, []);

  // Fetch quiz data
  const { data: quiz, isLoading } = useQuery<QuizWithQuestions>({
    queryKey: [`/api/quiz/${quizId}`],
    enabled: Boolean(quizId),
  });

  // WebSocket for real-time updates
  const { sendMessage, isConnected } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'quiz_started':
          setQuizStarted(true);
          setCurrentQuestionIndex(0);
          setStartTime(Date.now());
          toast({
            title: "Quiz Started!",
            description: "Good luck! Answer each question carefully.",
          });
          break;
        case 'pause_timer':
          setIsTimerActive(false);
          break;
        case 'resume_timer':
          setIsTimerActive(true);
          break;
        case 'next_question':
          setCurrentQuestionIndex(message.currentQuestionIndex);
          setSelectedAnswer(null);
          setHasAnswered(false);
          setStartTime(Date.now());
          break;
        case 'quiz_completed':
          setIsQuizCompleted(true);
          setRankings(message.rankings);
          toast({
            title: "Quiz Completed!",
            description: "See how you did!",
          });
          break;
      }
    },
    onConnect: () => {
      console.log('WebSocket connected, participant:', participant);
      if (quizId && participant) {
        console.log('Sending join_room message');
        sendMessage({
          type: 'join_room',
          quizId: parseInt(quizId),
          participantId: participant.id,
          role: 'participant'
        });
      }
    }
  });

  // Send join room message when participant data becomes available
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  
  useEffect(() => {
    if (isConnected && quizId && participant && !hasJoinedRoom) {
      console.log('Sending join_room message after participant loaded');
      sendMessage({
        type: 'join_room',
        quizId: parseInt(quizId),
        participantId: participant.id,
        role: 'participant'
      });
      setHasJoinedRoom(true);
    }
  }, [isConnected, participant, quizId, sendMessage, hasJoinedRoom]);

  const submitAnswerMutation = useMutation({
    mutationFn: async (answerIndex: number) => {
      if (!participant || !quiz?.questions?.[currentQuestionIndex] || !startTime) {
        throw new Error('Missing required data');
      }

      const responseTime = Math.floor((Date.now() - startTime) / 1000);
      
      return apiRequest('POST', '/api/response', {
        participantId: participant.id,
        questionId: quiz.questions[currentQuestionIndex].id,
        selectedAnswer: answerIndex,
        responseTime,
      });
    },
    onSuccess: () => {
      setHasAnswered(true);
      toast({
        title: "Answer Submitted!",
        description: "Waiting for other participants...",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Submit Answer",
        description: error.message,
        variant: "destructive",
      });
      setSelectedAnswer(null);
    },
  });

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered || !quizStarted) return;
    
    setSelectedAnswer(answerIndex);
    submitAnswerMutation.mutate(answerIndex);
  };

  const handleTimerExpire = () => {
    if (hasAnswered) return;

    toast({
      title: "Time's Up!",
      description: "Moving to next question.",
      variant: "destructive",
    });

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < quiz.questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setStartTime(Date.now());
      setTimerResetKey((prev) => prev + 1);
    } else {
      // End of quiz reached
      setIsQuizCompleted(true);
    }
  };


  const currentQuestion = quiz?.questions?.[currentQuestionIndex];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!quiz) {
    return <div className="text-center">Quiz not found</div>;
  }

  if (!participant) {
    return <div className="text-center">Participant information not found</div>;
  }

  // Show final dashboard if quiz is completed
  if (isQuizCompleted) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <FinalDashboard 
          rankings={rankings} 
          isPresenter={false} 
          currentParticipantId={participant.id}
        />
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{quiz.title}</h2>
            <p className="text-gray-600 mb-4">
              Welcome, <span className="font-semibold">{participant.name}</span>!
            </p>
            <p className="text-gray-600 mb-8">
              Waiting for the quiz to start...
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <div className="mt-6 text-sm text-gray-500">
              Connection: {isConnected ? '✅ Connected' : '❌ Disconnected'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
              <p className="text-gray-600">Connected as <span className="font-semibold">{participant.name}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Question</p>
              <p className="text-lg font-bold text-primary">
                {currentQuestionIndex + 1}/{quiz.questions.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Interface */}
      {hasAnswered ? (
        /* Waiting State */
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Answer Submitted!</h3>
            <p className="text-gray-600 mb-6">Waiting for other participants to finish...</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Question Card */
        <Card>
          <CardContent className="p-8">
            {/* Timer */}
            <div className="flex justify-center mb-8">
              <Timer
                duration={quiz.timePerQuestion}
                isActive={isTimerActive}
                onComplete={handleTimerExpire}
                className="w-20 h-20"
                resetKey={timerResetKey}
              />
            </div>

            {/* Question */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {currentQuestion?.questionText}
              </h3>
            </div>

            {/* Answer Options */}
            <div className="space-y-4">
              {currentQuestion?.options.map((option, index) => (
                <Button
                   key={index}
  className={`w-full p-6 h-auto text-left border rounded-md bg-white hover:border-primary hover:bg-blue-50 text-black transition-all duration-200 break-words whitespace-normal ${
    selectedAnswer === index ? 'border-primary bg-blue-50' : ''
  }`}
  onClick={() => handleAnswerSelect(index)}
  disabled={submitAnswerMutation.isPending}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 ${
                      selectedAnswer === index ? 'bg-primary' : 'bg-gray-400 text-black'
                    } text-black/100 rounded-full flex items-center justify-center font-bold text-lg`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-lg font-medium break-words whitespace-normal">{option}</span>
                  </div>
                </Button>
              ))}
            </div>

            {/* Status */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {submitAnswerMutation.isPending ? 'Submitting your answer...' : 'Tap an answer to submit your response'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
