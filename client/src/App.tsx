import { useState, useEffect } from "react"
import { useLocation } from "wouter";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Brain } from "lucide-react";
import Landing from "@/pages/landing";
import CreateQuiz from "@/pages/create-quiz";
import JoinQuiz from "@/pages/join-quiz";
import PresenterDashboard from "@/pages/presenter-dashboard";
import StudentInterface from "@/pages/student-interface";
import NotFound from "@/pages/not-found";
import GoogleLoginButton from "@/components/GoogleLoginButton"
import Profile from "@/pages/profile";
import CreateRoomChooser from "./pages/create-option";

type GoogleUser = {
  name: string;
  email: string;
  picture: string;
  sub: string;
};

// Header component
type Props = {
  user: GoogleUser | null;
  setUser: (user: GoogleUser | null) => void;
};

function Header({user, setUser} : Props) {
  const [, navigate] = useLocation();


  return (
    <header className="bg-[#EAE1FF] backdrop-blur-md shadow-sm border-b border-white/20 px-6 py-2 rounded-b-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Quizzr</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="/" className="text-gray-600 hover:text-primary font-medium">Dashboard</a>
            <a href="#" className="text-gray-600 hover:text-primary font-medium">My Quizzes</a>
            <a href="#" className="text-gray-600 hover:text-primary font-medium">Help</a>
          </nav>
          <div className="flex items-center space-x-3">
            {!user ? (
              <GoogleLoginButton onLogin = {setUser} />
            ): (
              <div className="relative group">
  <img
    src={user.picture}
    alt="Profile"
    className="w-8 h-8 rounded-full cursor-pointer"
  />
  <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all z-50">
    <button
      onClick={() => navigate("/profile")}
      className="w-full text-left px-4 py-2 hover:bg-gray-100"
    >
      Profile
    </button>
    <button
      onClick={() => setUser(null)}
      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
    >
      Logout
    </button>
  </div>
</div>

            )}
          </div>
        </div>
      </div>
    </header>
  );
}


function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path = "/profile" component = {Profile}/>
      <Route path="/create" component={CreateRoomChooser} />
      <Route path="/create/quiz" component={CreateQuiz} />
      <Route path="/join" component={JoinQuiz} />
      <Route path="/presenter/:quizId">
        {(params) => <PresenterDashboard quizId={params.quizId} />}
      </Route>
      <Route path="/student/:quizId">
        {(params) => <StudentInterface quizId={params.quizId} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="relative min-h-screen">
 {/* Background base color */}
<div className="absolute inset-0 bg-[#F5F5FD] -z-20" />

{/* Glassmorphism overlay */}
<div className="absolute inset-0 bg-white/30 backdrop-blur-md -z-10" />


  <Header user = {user} setUser = {setUser} />
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <Router />
  </main>
</div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
