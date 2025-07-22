// /create/index.tsx

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Sparkles, Cloud } from "lucide-react";

export default function CreateRoomChooser() {
  return (
    <div className="max-w-xl mx-auto py-16 space-y-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Choose Room Type</h1>
      <p className="text-gray-600">Would you like to host a quiz or a word cloud?</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 space-y-4">
            <Sparkles className="w-6 h-6 mx-auto text-purple-600" />
            <h2 className="text-lg font-semibold">Quiz Room</h2>
            <p className="text-sm text-gray-600">Create AI-powered quiz questions for real-time play.</p>
            <Link href="/create/quiz">
              <Button className="w-full">Create Quiz</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 space-y-4">
            <Cloud className="w-6 h-6 mx-auto text-blue-600" />
            <h2 className="text-lg font-semibold">Word Cloud</h2>
            <p className="text-sm text-gray-600">Collect free-text input from participants and show live word clouds.</p>
            <Link href="/create/wordcloud">
              <Button className="w-full">Create Word Cloud</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
