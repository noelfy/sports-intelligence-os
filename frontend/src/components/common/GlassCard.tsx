"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-6 transition-all duration-300",
        hover && "hover:border-white/10 hover:shadow-lg hover:shadow-sky-500/5",
        className
      )}
    >
      {children}
    </div>
  );
}
