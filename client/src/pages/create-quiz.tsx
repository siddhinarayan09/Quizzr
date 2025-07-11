import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  topic: z.string().min(10, "Please provide a more detailed topic description"),
  questionsCount: z.number().min(5).max(20),
  timePerQuestion: z.number().min(15).max(120),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  randomizeOrder: z.boolean().default(false),
  showCorrectAnswers: z.boolean().default(false),
  showLiveResults: z.boolean().default(true),
});

type CreateQuizForm = z.infer<typeof createQuizSchema>;

export default function CreateQuiz() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<CreateQuizForm>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: "",
      topic: "",
      questionsCount: 10,
      timePerQuestion: 30,
      difficulty: 'medium',
      randomizeOrder: false,
      showCorrectAnswers: false,
      showLiveResults: true,
    },
  });

  const createQuizMutation = useMutation({
    mutationFn: async (data: CreateQuizForm) => {
      const response = await apiRequest('POST', '/api/quiz/generate', data);
      return response.json();
    },
    onSuccess: (quiz) => {
      toast({
        title: "Quiz Created Successfully!",
        description: `Your quiz "${quiz.title}" is ready to present.`,
      });
      setLocation(`/presenter/${quiz.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateQuizForm) => {
    createQuizMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Create New Quiz</h2>
      </div>

      {/* Quiz Creation Form */}
      <Card>
        <CardContent className="p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Quiz Title */}
            <div>
              <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Quiz Title</Label>
              <Input
                id="title"
                placeholder="Enter quiz title..."
                {...form.register("title")}
                className="mt-2"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* AI Topic Prompt */}
            <div>
              <Label htmlFor="topic" className="text-sm font-semibold text-gray-700">Topic Description</Label>
              <Textarea
                id="topic"
                rows={4}
                placeholder="Describe the topic you want to create a quiz about. Be specific about the subject matter, difficulty level, and any particular areas to focus on..."
                {...form.register("topic")}
                className="mt-2 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">AI will generate questions based on your description</p>
              {form.formState.errors.topic && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.topic.message}</p>
              )}
            </div>

            {/* Quiz Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700">Questions</Label>
                <Select onValueChange={(value) => form.setValue("questionsCount", parseInt(value))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select number of questions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="15">15 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">Time per Question</Label>
                <Select onValueChange={(value) => form.setValue("timePerQuestion", parseInt(value))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select time limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="45">45 seconds</SelectItem>
                    <SelectItem value="60">60 seconds</SelectItem>
                    <SelectItem value="90">90 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <Label className="text-sm font-semibold text-gray-700">Difficulty Level</Label>
              <Select onValueChange={(value: 'easy' | 'medium' | 'hard') => form.setValue("difficulty", value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Options */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Options</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="randomizeOrder"
                    onCheckedChange={(checked) => form.setValue("randomizeOrder", !!checked)}
                  />
                  <Label htmlFor="randomizeOrder" className="text-sm text-gray-700">
                    Randomize question order
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showCorrectAnswers"
                    onCheckedChange={(checked) => form.setValue("showCorrectAnswers", !!checked)}
                  />
                  <Label htmlFor="showCorrectAnswers" className="text-sm text-gray-700">
                    Show correct answers after each question
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showLiveResults"
                    checked={form.watch("showLiveResults")}
                    onCheckedChange={(checked) => form.setValue("showLiveResults", !!checked)}
                  />
                  <Label htmlFor="showLiveResults" className="text-sm text-gray-700">
                    Allow participants to see live results
                  </Label>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createQuizMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {createQuizMutation.isPending ? "Generating Quiz..." : "Generate Quiz with AI"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
