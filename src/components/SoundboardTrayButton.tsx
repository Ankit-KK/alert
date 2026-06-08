import { useState } from "react";
import { Music3 } from "lucide-react";
import SoundboardTray from "./SoundboardTray";

interface Props { streamerSlug: string; }

export default function SoundboardTrayButton({ streamerSlug }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="sb-launch group" aria-label="Open Soundboard">
        <span className="sb-launch-icon"><Music3 className="h-4 w-4 text-white" /></span>
        <span className="sb-launch-label">Soundboard</span>
        <style>{`
          .sb-launch { display: inline-flex; align-items: center; gap: 9px; height: 42px; padding: 0 16px 0 8px; border-radius: 999px; color: #fff; font-size: 13px; font-weight: 600; letter-spacing: 0.01em; background: linear-gradient(135deg, rgba(124,58,237,0.85), rgba(34,211,238,0.7)); border: 1px solid rgba(168,85,247,0.5); box-shadow: 0 10px 30px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.25); backdrop-filter: blur(10px); transition: transform .2s ease, filter .2s ease, box-shadow .2s ease; }
          .sb-launch:hover { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 14px 38px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.3); }
          .sb-launch:active { transform: translateY(0); }
          .sb-launch-icon { height: 28px; width: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.16); box-shadow: inset 0 1px 0 rgba(255,255,255,0.25); transition: transform .35s ease; }
          .sb-launch:hover .sb-launch-icon { transform: rotate(-12deg) scale(1.06); }
        `}</style>
      </button>
      <SoundboardTray streamerSlug={streamerSlug} open={open} onOpenChange={setOpen} />
    </>
  );
}
