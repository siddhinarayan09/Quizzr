import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const joinQuizSchema = z.object({
  roomCode: z.string().length(6, "Room code must be 6 characters"),
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
});

type JoinQuizForm = z.infer<typeof joinQuizSchema>;

export default function JoinQuiz() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<JoinQuizForm>({
    resolver: zodResolver(joinQuizSchema),
    defaultValues: {
      roomCode: "",
      name: "",
    },
  });

  const joinQuizMutation = useMutation({
    mutationFn: async (data: JoinQuizForm) => {
      const response = await apiRequest('POST', `/api/quiz/${data.roomCode}/join`, { name: data.name });
      return response.json();
    },
    onSuccess: (data) => {
      const { participant, quiz } = data;
      toast({
        title: "Successfully Joined!",
        description: `Welcome to "${quiz.title}"`,
      });
      // Store participant info in localStorage for the session
      localStorage.setItem('participant', JSON.stringify(participant));
      setLocation(`/student/${quiz.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to Join Quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JoinQuizForm) => {
    joinQuizMutation.mutate(data);
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Join Quiz</h2>
      </div>

      {/* Join Form */}
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Enter Quiz Code</h3>
          <p className="text-gray-600 mb-8">Ask your presenter for the 6-digit quiz code</p>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                placeholder="Enter code..."
                className="text-center text-2xl font-mono tracking-wider uppercase"
                maxLength={6}
                {...form.register("roomCode", {
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }
                })}
              />
              {form.formState.errors.roomCode && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.roomCode.message}</p>
              )}
            </div>
            
            <div>
              <Input
                placeholder="Your name..."
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              disabled={joinQuizMutation.isPending}
            >
              {joinQuizMutation.isPending ? "Joining..." : "Join Quiz"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
