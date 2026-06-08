import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ImageIcon, Music2, Play, Pause, X, UploadCloud, Sparkles, Check } from "lucide-react";

const MAX_DURATION_S = 7.0;
const MAX_AUDIO_BYTES = 1_500_000;
const MAX_IMAGE_BYTES = 3_000_000;
const AUDIO_ACCEPT = "audio/mpeg,audio/mp3";
const IMAGE_ACCEPT = "image/gif,image/png,image/jpeg,image/webp";

const fmtSize = (n: number) => n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;
const toast = (opts: any) => console.log("TOAST:", opts.title, opts.description);

const probeAudioDuration = async (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = () => resolve(4.5); 
  });
};

interface Props { streamerSlug: string; onCreated: () => void; }

export default function AddNewPanel({ streamerSlug, onCreated }: Props) {
  const [name, setName] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioErr, setAudioErr] = useState<string | null>(null);
  const [imageErr, setImageErr] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [busy, setBusy] = useState(false);
  const audioRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const previewDuration = audioDuration ?? 0;

  useEffect(() => {
    if (!imageFile) { setImagePreview(null); return; }
    const url = URL.createObjectURL(imageFile); setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    setAudioDuration(null); setPlaying(false); audioElRef.current?.pause(); audioElRef.current = null;
    if (!audioFile) { setAudioPreview(null); return; }
    const url = URL.createObjectURL(audioFile); setAudioPreview(url);
    probeAudioDuration(audioFile).then((d) => {
      setAudioDuration(d);
      if (d > MAX_DURATION_S) setAudioErr(`Max ${MAX_DURATION_S}s, got ${d.toFixed(2)}s`);
    }).catch(() => {});
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  const validateAudio = (f: File): string | null => {
    if (f.type !== "audio/mpeg" && f.type !== "audio/mp3" && !/\.mp3$/i.test(f.name)) return "MP3 only";
    if (f.size > MAX_AUDIO_BYTES) return `Max ${fmtSize(MAX_AUDIO_BYTES)}`;
    return null;
  };
  const validateImage = (f: File): string | null => {
    if (!/^image\/(gif|png|jpeg|webp)$/.test(f.type)) return "GIF, PNG, JPG or WEBP only";
    if (f.size > MAX_IMAGE_BYTES) return `Max ${fmtSize(MAX_IMAGE_BYTES)}`;
    return null;
  };

  const pickAudio = (f: File | null) => { if (!f) { setAudioFile(null); setAudioErr(null); return; } const err = validateAudio(f); setAudioErr(err); setAudioFile(err ? null : f); };
  const pickImage = (f: File | null) => { if (!f) { setImageFile(null); setImageErr(null); return; } const err = validateImage(f); setImageErr(err); setImageFile(err ? null : f); };

  const togglePreview = () => {
    if (!audioPreview) return;
    if (playing) { audioElRef.current?.pause(); setPlaying(false); return; }
    const a = audioElRef.current ?? new Audio(audioPreview); audioElRef.current = a;
    a.onended = () => setPlaying(false);
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const resetAll = () => {
    setName(""); setAudioFile(null); setImageFile(null); setAudioErr(null); setImageErr(null);
    if (audioRef.current) audioRef.current.value = "";
    if (imageRef.current) imageRef.current.value = "";
  };

  const submit = async () => {
    if (!name.trim() || !audioFile || !imageFile || audioErr || imageErr) {
      toast({ title: "Missing fields", description: "Name, MP3 audio, and an image are all required.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const duration = audioDuration ?? (await probeAudioDuration(audioFile));
      if (duration > MAX_DURATION_S) {
        toast({ title: "Audio too long", description: `Max ${MAX_DURATION_S}s, got ${duration.toFixed(2)}s`, variant: "destructive" });
        setBusy(false); return;
      }
      
      // MOCK UPLOADS
      await new Promise(r => setTimeout(r, 1500)); // Mock audio upload
      await new Promise(r => setTimeout(r, 1500)); // Mock image upload

      toast({ title: "Slot added", description: `“${name.trim()}” is now in Hidden — unhide it to use.` });
      resetAll();
      onCreated();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = !!name.trim() && !!audioFile && !!imageFile && !audioErr && !imageErr && !busy;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="sb-howto">
        <div className="sb-howto-icon"><Sparkles className="w-4 h-4 text-white" /></div>
        <p className="text-sm leading-relaxed text-white/70">
          <span className="font-semibold text-white">How it works — </span>
          Upload an image + short MP3 (≤{MAX_DURATION_S}s). New slots appear in <span className="font-semibold text-cyan-300">Hidden</span>, then unhide to activate.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DropZone kind="image" file={imageFile} preview={imagePreview} error={imageErr} onPick={pickImage} onClear={() => pickImage(null)} inputRef={imageRef} accept={IMAGE_ACCEPT} hint="GIF / PNG / JPG / WEBP" subHint="Max 3 MB" />
        <DropZone kind="audio" file={audioFile} preview={audioPreview} error={audioErr} onPick={pickAudio} onClear={() => pickAudio(null)} inputRef={audioRef} accept={AUDIO_ACCEPT} hint={`MP3 only · ≤${MAX_DURATION_S}s`} subHint="Max 1.5 MB" playing={playing} duration={audioDuration} onTogglePlay={togglePreview} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={cn("sb-statuschip", imageFile && !imageErr && "sb-statuschip-ok")}>
          {imageFile && !imageErr ? (<><Check className="h-3.5 w-3.5" /> Image ready</>) : (<><ImageIcon className="h-3.5 w-3.5 opacity-60" /> Image required</>)}
        </div>
        <div className={cn("sb-statuschip", audioFile && !audioErr && "sb-statuschip-ok")}>
          {audioFile && !audioErr ? (<><Check className="h-3.5 w-3.5" /> Audio ready · {previewDuration.toFixed(1)}s</>) : (<><Music2 className="h-3.5 w-3.5 opacity-60" /> Audio required</>)}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sb-name" className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Display name</Label>
        <Input id="sb-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="e.g. Air Horn, Wow, Let's Go…" className="sb-name-input h-11 text-sm" />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={!canSubmit} className={cn("sb-add-btn flex-1 h-11 font-semibold text-white", canSubmit && "sb-add-btn-active")}>
          {busy ? (<span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading…</span>) : (<span className="flex items-center gap-2"><UploadCloud className="h-4 w-4" /> Add to Hidden</span>)}
        </Button>
        {(audioFile || imageFile || name) && !busy && (<Button variant="ghost" onClick={resetAll} className="h-11 text-white/50 hover:text-white hover:bg-white/5">Reset</Button>)}
      </div>
      <AddNewStyles />
    </div>
  );
}

function AddNewStyles() {
  return (
    <style>{`
      .sb-howto { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 16px; background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(34,211,238,0.07)); border: 1px solid rgba(168,85,247,0.22); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06); }
      .sb-howto-icon { height: 28px; width: 28px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #7c3aed, #22d3ee); box-shadow: 0 4px 12px rgba(124,58,237,0.4); }
      .sb-statuschip { display: flex; align-items: center; justify-content: center; gap: 7px; height: 42px; border-radius: 12px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.45); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); transition: all .2s ease; }
      .sb-statuschip-ok { color: #6ee7b7; background: rgba(16,185,129,0.10); border-color: rgba(16,185,129,0.35); box-shadow: 0 0 18px rgba(16,185,129,0.12); }
      .sb-name-input { border-radius: 12px !important; background: rgba(255,255,255,0.04) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #fff !important; transition: all .18s ease; }
      .sb-name-input::placeholder { color: rgba(255,255,255,0.32) !important; }
      .sb-name-input:focus-visible { border-color: rgba(168,85,247,0.55) !important; box-shadow: 0 0 0 3px rgba(168,85,247,0.15), 0 0 20px rgba(168,85,247,0.12) !important; }
      .sb-add-btn { border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); transition: all .2s ease; }
      .sb-add-btn-active { background: linear-gradient(135deg, #7c3aed, #22d3ee); border-color: transparent; box-shadow: 0 10px 28px rgba(124,58,237,0.40), inset 0 1px 0 rgba(255,255,255,0.25); }
      .sb-add-btn-active:hover { filter: brightness(1.08); transform: translateY(-1px); }
      .sb-drop { position: relative; overflow: hidden; cursor: pointer; min-height: 168px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 16px; background: rgba(255,255,255,0.025); transition: all .22s ease; }
      .sb-drop::before { content: ''; position: absolute; inset: 0; border-radius: 18px; padding: 1.5px; background: linear-gradient(135deg, rgba(168,85,247,0.4), rgba(34,211,238,0.3), rgba(168,85,247,0.4)); background-size: 200% 200%; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0.5; transition: opacity .22s ease; animation: sb-border-flow 4s linear infinite; }
      .sb-drop:hover::before { opacity: 1; }
      .sb-drop:hover { background: rgba(168,85,247,0.06); transform: translateY(-2px); }
      .sb-drop-drag::before { opacity: 1; }
      .sb-drop-drag { background: rgba(168,85,247,0.12); box-shadow: 0 0 40px rgba(168,85,247,0.25); transform: scale(1.01); }
      .sb-drop-filled::before { opacity: 0.85; }
      .sb-drop-error::before { background: rgba(248,113,113,0.6); }
      @keyframes sb-border-flow { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
      .sb-drop-iconwrap { height: 46px; width: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(124,58,237,0.25), rgba(34,211,238,0.18)); border: 1px solid rgba(168,85,247,0.3); animation: sb-float 3s ease-in-out infinite; }
      @keyframes sb-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      .sb-wave { display: flex; align-items: flex-end; gap: 2px; height: 22px; }
      .sb-wave-bar { width: 2.5px; border-radius: 2px; background: linear-gradient(to top, #7c3aed, #22d3ee); }
      .sb-wave-play .sb-wave-bar { animation: sb-wbar .8s ease-in-out infinite; }
      .sb-wave-bar:nth-child(1){animation-delay:0s} .sb-wave-bar:nth-child(2){animation-delay:.1s}
      .sb-wave-bar:nth-child(3){animation-delay:.2s} .sb-wave-bar:nth-child(4){animation-delay:.3s}
      .sb-wave-bar:nth-child(5){animation-delay:.15s} .sb-wave-bar:nth-child(6){animation-delay:.25s}
      .sb-wave-bar:nth-child(7){animation-delay:.05s} .sb-wave-bar:nth-child(8){animation-delay:.35s}
      @keyframes sb-wbar { 0%,100%{height:5px} 50%{height:22px} }
    `}</style>
  );
}

interface DropZoneProps { kind: "image" | "audio"; file: File | null; preview: string | null; error: string | null; onPick: (f: File | null) => void; onClear: () => void; inputRef: React.RefObject<HTMLInputElement>; accept: string; hint: string; subHint?: string; playing?: boolean; duration?: number | null; onTogglePlay?: () => void; }
function DropZone({ kind, file, preview, error, onPick, onClear, inputRef, accept, hint, subHint, playing, duration, onTogglePlay }: DropZoneProps) {
  const [drag, setDrag] = useState(false);
  const Icon = kind === "image" ? ImageIcon : Music2;
  const title = kind === "image" ? "Drop image" : "Drop audio";
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onPick(f); };

  return (
    <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop} className={cn("sb-drop group", drag && "sb-drop-drag", file && !error && "sb-drop-filled", error && "sb-drop-error")} onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => onPick(e.target.files?.[0] || null)} />
      {kind === "image" && preview && (<><img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover rounded-[18px]" draggable={false} /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent rounded-[18px]" /></>)}
      {kind === "audio" && file && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
          <button type="button" onClick={(e) => { e.stopPropagation(); onTogglePlay?.(); }} className="h-12 w-12 rounded-full text-white flex items-center justify-center hover:scale-110 transition-transform" style={{ background: "linear-gradient(135deg, #7c3aed, #22d3ee)", boxShadow: "0 8px 24px rgba(124,58,237,0.5)" }}>
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <div className={cn("sb-wave", playing && "sb-wave-play")}>
            {Array.from({ length: 8 }).map((_, i) => (<span key={i} className="sb-wave-bar" style={{ height: playing ? undefined : `${6 + ((i * 5) % 16)}px` }} />))}
          </div>
          <div className="text-xs text-cyan-300 font-mono tracking-wide">{duration != null ? `${duration.toFixed(2)}s` : "…"} · {fmtSize(file.size)}</div>
        </div>
      )}
      {!file && (
        <div className="relative z-[1] flex flex-col items-center gap-3">
          <div className="sb-drop-iconwrap"><Icon className="h-5 w-5 text-cyan-200" /></div>
          <div className="text-[15px] font-bold text-white">{title}</div>
          <div className="text-[11px] font-medium text-white/45 tracking-wide">{hint}</div>
          {subHint && <div className="text-[10px] text-white/30">{subHint}</div>}
        </div>
      )}
      {file && (
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 z-20">
          <div className="text-[11px] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full truncate max-w-[78%] text-white border border-white/10 flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-400 shrink-0" />{file.name}</div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }} className="h-6 w-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-destructive hover:text-destructive-foreground transition-colors"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
      {error && (<div className="absolute bottom-2 left-2 right-2 text-[11px] text-red-300 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full z-20 border border-red-500/50 text-center">{error}</div>)}
    </div>
  );
}
