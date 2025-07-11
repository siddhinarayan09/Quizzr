import { useEffect } from "react";
import { useLocation } from "wouter";

type GoogleUser = {
    name: string;
    email: string;
    picture: string;
    sub: string; 
};

export default function Profile() {
    const [, navigate] = useLocation();

    const user = JSON.parse(localStorage.getItem("user") || "null") as GoogleUser | null;

    useEffect(() => {
        if (!user) navigate("/");
    }, [user]);
    
    if (!user) return null;

    return(
        <div className="max-w-md mx-auto bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-md text-center">
        <img
        src={user.picture}
        alt="Profile"
        className="w-24 h-24 rounded-full mx-auto mb-4"
        />
        <h2 className="text-2xl font-bold">{user.name}</h2>
        <p className="text-gray-600">{user.email}</p>
        </div>
        
    );
}