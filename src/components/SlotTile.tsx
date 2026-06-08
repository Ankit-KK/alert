import { useRef, useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, EyeOff, Eye, Trash2, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SoundboardSlot } from "../types";

interface Props {
  slot: SoundboardSlot; variant: "active" | "hidden"; index?: number; total?: number; canAdd?: boolean;
  onMoveUp?: () => void; onMoveDown?: () => void; onHide?: () => void; onUnhide?: () => void;
  onRename?: (name: string) => void; onDelete?: () => void; isPlaying: boolean; onTogglePlay: () => void;
}

export default function SlotTile({ slot, variant, index, total, canAdd, onMoveUp, onMoveDown, onHide, onUnhide, onRename, onDelete, isPlaying, onTogglePlay }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(slot.display_name);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const commitEdit = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    const next = draft.trim();
    if (next && next !== slot.display_name) onRename?.(next);
    setEditing(false);
  };
  const cancelEdit = (e?: React.MouseEvent | React.KeyboardEvent) => { e?.stopPropagation(); setEditing(false); };
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const isHidden = variant === "hidden";

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let animationId: number;
    const bars = 32; const barWidth = canvas.width / bars - 1;
    const heights = new Array(bars).fill(0);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < bars; i++) {
        heights[i] = isPlaying ? Math.sin(Date.now() * 0.005 + i * 0.5) * 0.4 + 0.6 : 0.3 + Math.sin(i * 0.7) * 0.1;
        const h = heights[i] * canvas.height * 0.8; const y = (canvas.height - h) / 2;
        ctx.fillStyle = isPlaying ? "rgba(168, 85, 247, 0.9)" : "rgba(168, 85, 247, 0.3)";
        ctx.fillRect(i * (barWidth + 1), y, barWidth, h);
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  return (
    <div onClick={editing ? undefined : onTogglePlay} className={cn(
      "group relative aspect-square overflow-hidden rounded-2xl border bg-black/40 cursor-pointer transition-all duration-300 select-none",
      "border-white/10 hover:border-primary/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:scale-[1.02]",
      isPlaying && "border-primary shadow-[0_0_35px_rgba(168,85,247,0.6)] ring-1 ring-primary/30 scale-[1.02]",
      isHidden && "opacity-70 hover:opacity-100"
    )}>
      {slot.image_url && <img src={slot.image_url} alt={slot.display_name} loading="lazy" className="absolute inset-0 h-full w-full object-cover rounded-2xl" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 rounded-2xl" />
      <canvas ref={canvasRef} width={120} height={40} className="absolute bottom-8 left-2 right-2 w-[calc(100%-16px)] h-10 opacity-80" />

      {isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex gap-1 items-end h-6">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-1 rounded-full bg-gradient-to-t from-purple-400 to-cyan-300" style={{ animation: `sb-eq-${i % 2} 0.6s ease-in-out ${i * 0.1}s infinite`, filter: "drop-shadow(0 0 6px rgba(168,85,247,0.8))" }} />
            ))}
          </div>
        </div>
      )}

      {/* MOBILE FIX: Always visible on mobile, hover-only on desktop */}
      <div className="absolute top-2 right-2 z-20 flex flex-wrap items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={stop}>
        {variant === "active" && (
          <>
            <IconBtn label="Move left" disabled={index === 0} onClick={onMoveUp}><ArrowLeft className="h-3.5 w-3.5" /></IconBtn>
            <IconBtn label="Move right" disabled={index! >= (total! - 1)} onClick={onMoveDown}><ArrowRight className="h-3.5 w-3.5" /></IconBtn>
            <IconBtn label="Rename" onClick={() => { setDraft(slot.display_name); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}><Pencil className="h-3.5 w-3.5" /></IconBtn>
            <IconBtn label="Hide" onClick={onHide}><EyeOff className="h-3.5 w-3.5" /></IconBtn>
          </>
        )}
        {variant === "hidden" && (
          <>
            <IconBtn label="Rename" onClick={() => { setDraft(slot.display_name); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}><Pencil className="h-3.5 w-3.5" /></IconBtn>
            <IconBtn label="Unhide" disabled={!canAdd} onClick={onUnhide}><Eye className="h-3.5 w-3.5" /></IconBtn>
            {slot.source === "custom" && <IconBtn label="Delete" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></IconBtn>}
          </>
        )}
      </div>

      <div className="absolute top-2 left-2 z-10 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/80 border border-white/10">{slot.source}</div>

      <div className="absolute inset-x-0 bottom-2 z-10 px-2.5">
        {editing ? (
          <div className="flex items-center gap-1" onClick={stop}>
            <Input ref={inputRef} value={draft} maxLength={60} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") commitEdit(e); if (e.key === "Escape") cancelEdit(e); }} className="h-6 px-2 text-[11px] bg-black/70 border-white/20 text-white placeholder:text-white/40" />
            <button onClick={commitEdit} className="rounded-full bg-primary p-1 text-primary-foreground hover:bg-primary/80"><Check className="h-3 w-3" /></button>
            <button onClick={cancelEdit} className="rounded-full bg-white/10 p-1 text-white hover:bg-white/20"><X className="h-3 w-3" /></button>
          </div>
        ) : (
          <div className="text-[13px] font-bold leading-tight text-white line-clamp-2 text-shadow" title={slot.display_name}>{slot.display_name}</div>
        )}
        <div className="mt-0.5 text-[10px] font-medium tracking-wide text-cyan-400 tabular-nums">{slot.audio_duration_s?.toFixed?.(1) ?? "—"}s</div>
      </div>
      <style>{`@keyframes sb-eq-0 { 0%,100%{height:4px} 50%{height:18px} } @keyframes sb-eq-1 { 0%,100%{height:14px} 50%{height:5px} } .text-shadow { text-shadow: 0 2px 4px rgba(0,0,0,0.9); }`}</style>
    </div>
  );
}

function IconBtn({ children, onClick, disabled, label }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; label: string; }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={(e) => { e.stopPropagation(); if (!disabled) onClick?.(); }}
      className={cn("flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 transition-all", "hover:bg-primary hover:text-primary-foreground hover:shadow-glow", disabled && "opacity-40 cursor-not-allowed hover:bg-black/60 hover:text-white")}>
      {children}
    </button>
  );
}
