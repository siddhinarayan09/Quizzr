import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Clock, Target } from "lucide-react";
import type { ParticipantRanking } from "@shared/schema";

interface FinalDashboardProps {
  rankings: ParticipantRanking[];
  isPresenter?: boolean;
  currentParticipantId?: number;
}

export function FinalDashboard({ rankings, isPresenter = false, currentParticipantId }: FinalDashboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default:
        return "bg-gray-50 text-gray-900";
    }
  };

  const currentParticipant = rankings.find(r => r.participantId === currentParticipantId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            🎉 Quiz Complete!
          </CardTitle>
          <p className="text-gray-600">
            {isPresenter ? "Final results and participant rankings" : "Great job! Here are the final results"}
          </p>
        </CardHeader>
      </Card>

      {/* Current Participant Results (Student View) */}
      {!isPresenter && currentParticipant && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-black/100">Your Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-4">
                {getRankIcon(currentParticipant.rank)}
                <div>
                  <h3 className="font-semibold text-lg">{currentParticipant.participantName}</h3>
                  <p className="text-gray-600">Rank #{currentParticipant.rank}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{currentParticipant.score}%</div>
                <div className="text-sm text-gray-600">
                  {currentParticipant.correctAnswers}/{currentParticipant.totalQuestions} correct
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center text-black/100">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Final Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rankings.map((participant, index) => (
              <div
                key={participant.participantId}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  getRankColor(participant.rank)
                } ${
                  participant.participantId === currentParticipantId ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  {getRankIcon(participant.rank)}
                  <div>
                    <h3 className={`font-semibold ${
                      participant.rank <= 3 ? 'text-black/100' : 'text-black/100'
                    }`}>
                      {participant.participantName}
                    </h3>
                    <p className={`text-sm ${
                      participant.rank <= 3 ? 'text-black/100' : 'text-black/100'
                    }`}>
                      Rank #{participant.rank}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    participant.rank <= 3 ? 'text-black/100' : 'text-black/100'
                  }`}>
                    {participant.score}%
                  </div>
                  <div className={`text-sm ${
                    participant.rank <= 3 ? 'text-black/100' : 'text-black/100'
                  }`}>
                    {participant.correctAnswers}/{participant.totalQuestions} correct
                  </div>
                </div>

                <div className="text-right">
                  <div className={`flex items-center text-sm ${
                    participant.rank <= 3 ? 'text-black/100' : 'text-black/100'
                  }`}>
                    <Clock className="w-4 h-4 mr-1" />
                    {Math.round(participant.averageResponseTime / 1000)}s avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview (Presenter View) */}
      {isPresenter && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Target className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(rankings.reduce((sum, r) => sum + r.score, 0) / rankings.length)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(rankings.reduce((sum, r) => sum + r.averageResponseTime, 0) / rankings.length / 1000)}s
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Trophy className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Top Performer</p>
                  <p className="text-lg font-bold text-gray-900">
                    {rankings[0]?.participantName || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}