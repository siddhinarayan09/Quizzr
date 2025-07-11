import { useEffect, useState } from 'react';

interface TimerProps {
  duration: number; // in seconds
  onComplete?: () => void;
  isActive?: boolean;
  className?: string;
  resetKey?: any;
}

export function Timer({ duration, onComplete, isActive = true, className = "", resetKey }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration, resetKey]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onComplete]);

  const progress = ((duration - timeLeft) / duration) * 100;
  const circumference = 2 * Math.PI * 10;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative ${className}`}>
      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="hsl(20, 5.9%, 90%)"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="hsl(24, 95%, 53%)"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-orange-500">{timeLeft}</span>
      </div>
    </div>
  );
}
