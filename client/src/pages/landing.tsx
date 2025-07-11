import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Users, BarChart3, Plus, LogIn } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Create Interactive Quizzes with AI
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Generate engaging quiz presentations from any topic using AI. Students join with a code and participate in real-time.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/create">
            <Button size="lg" className="flex items-center space-x-2 shadow-md">
              <Plus className="w-4 h-4" />
              <span>Create Quiz</span>
            </Button>
          </Link>
          <Link href="/join">
            <Button variant="outline" size="lg" className="flex items-center space-x-2">
              <LogIn className="w-4 h-4" />
              <span>Join Quiz</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-16">
        <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Generated Content</h3>
            <p className="text-gray-600">Simply enter a topic and let AI create comprehensive quiz questions with multiple choice answers.</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Participation</h3>
            <p className="text-gray-600">Students join instantly with a room code and vote on answers with live results displayed.</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Analytics</h3>
            <p className="text-gray-600">View real-time voting results, participation rates, and detailed quiz analytics.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
