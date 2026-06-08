// src/components/ui.tsx
import React from 'react';
import { cn } from '@/lib/utils';

export function Button({ children, className, variant, size, disabled, ...props }: any) {
  let base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
  if (variant === "ghost") base += " hover:bg-white/10 text-white";
  else base += " bg-white text-black hover:bg-white/90";
  
  if (size === "sm") base += " h-9 px-3";
  else base += " h-10 px-4 py-2";

  return <button disabled={disabled} className={`${base} ${className}`} {...props}>{children}</button>;
}

export function Input({ className, ...props }: any) {
  return <input className={`flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
}

export function Label({ className, ...props }: any) {
  return <label className={`text-sm font-medium leading-none text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />;
}

export function Slider({ value, onValueChange, max, step, className }: any) {
  return (
    <input
      type="range"
      min={0}
      max={max}
      step={step}
      value={value?.[0] ?? 0}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      className={`w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500 ${className}`}
    />
  );
}

export function Drawer({ open, onOpenChange, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="w-full animate-[slide-up_0.3s_ease-out_forwards]"
      >
        {children}
      </div>
    </div>
  );
}

export function DrawerContent({ children, className }: any) {
  return <div className={cn("bg-zinc-950 border-t border-white/10 rounded-t-[28px] overflow-hidden", className)}>{children}</div>;
}

export function DrawerHeader({ children, className }: any) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

export function DrawerTitle({ children, className }: any) {
  return <h2 className={cn("text-lg font-semibold text-white", className)}>{children}</h2>;
}

export function DrawerDescription({ children, className }: any) {
  return <p className={cn("text-sm text-zinc-400", className)}>{children}</p>;
}
