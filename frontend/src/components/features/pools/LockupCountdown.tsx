'use client';

import { useState, useEffect } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LockupCountdownProps {
  unlockDate: string;
  daysRemaining: number;
  className?: string;
  showIcon?: boolean;
  variant?: 'badge' | 'text' | 'detailed';
}

/**
 * LockupCountdown - Real-time countdown timer for locked positions
 *
 * Displays the time remaining until a position unlocks, updating in real-time.
 * Can be used in different variants depending on the UI context.
 */
export function LockupCountdown({
  unlockDate,
  daysRemaining: initialDays,
  className,
  showIcon = true,
  variant = 'badge'
}: LockupCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: initialDays,
    hours: 0,
    minutes: 0,
    isUnlocked: initialDays <= 0
  });

  useEffect(() => {
    const unlock = new Date(unlockDate).getTime();

    const calculateTimeLeft = () => {
      const now = Date.now();
      const diff = unlock - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, isUnlocked: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes, isUnlocked: false });
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every minute
    const interval = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [unlockDate]);

  // Position is unlocked
  if (timeLeft.isUnlocked) {
    if (variant === 'badge') {
      return (
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          "bg-forge-teal/10 text-forge-teal border border-forge-teal/20",
          className
        )}>
          {showIcon && <Unlock className="h-3 w-3" />}
          Unlocked
        </span>
      );
    }
    return (
      <span className={cn("text-forge-teal", className)}>
        {showIcon && <Unlock className="h-3 w-3 inline mr-1" />}
        Unlocked
      </span>
    );
  }

  // Badge variant (compact)
  if (variant === 'badge') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        "bg-forge-rose-gold/10 text-forge-rose-gold border border-forge-rose-gold/20",
        className
      )}>
        {showIcon && <Lock className="h-3 w-3" />}
        {timeLeft.days}d {timeLeft.hours}h
      </span>
    );
  }

  // Text variant (inline)
  if (variant === 'text') {
    return (
      <span className={cn("text-forge-rose-gold text-sm", className)}>
        {showIcon && <Lock className="h-3 w-3 inline mr-1" />}
        {timeLeft.days} day{timeLeft.days !== 1 ? 's' : ''} remaining
      </span>
    );
  }

  // Detailed variant (full breakdown)
  return (
    <div className={cn("flex items-center gap-2 text-forge-rose-gold", className)}>
      {showIcon && <Lock className="h-4 w-4" />}
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-semibold">{timeLeft.days}</span>
        <span className="text-xs opacity-70">days</span>
        <span className="text-lg font-semibold ml-2">{timeLeft.hours}</span>
        <span className="text-xs opacity-70">hrs</span>
        <span className="text-lg font-semibold ml-2">{timeLeft.minutes}</span>
        <span className="text-xs opacity-70">min</span>
      </div>
    </div>
  );
}
