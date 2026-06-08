import { useEffect, useRef, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, Button, Slider } from "@/components/ui";
import { useSoundboardMock } from "../hooks/useSoundboardMock";
import SlotTile from "./SlotTile";
import AddNewPanel from "./AddNewPanel";
import { Volume2, Search, Save, RefreshCw, Plus, X, Music3, LayoutGrid, EyeOff, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const toast = (opts: any) => console.log("TOAST:", opts.title, opts.description);

interface Props { streamerSlug: string; open: boolean; onOpenChange: (v: boolean) => void; }

export default function SoundboardTray({ streamerSlug, open, onOpenChange }: Props) {
  const [seeding, setSeeding] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false); // Replaces AlertDialog
  const { active, hidden, loading, saving, error, isDirty, MAX_ACTIVE, refresh, hideSlot, unhideSlot, moveSlot, renameSlot, save, restoreDefaults, deleteSlot } = useSoundboardMock(streamerSlug);
  const [tab, setTab] = useState<"active" | "hidden" | "add">("active");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [masterVolume, setMasterVolume] = useState(70);
  const [search, setSearch] = useState("");

  const stopAudio = () => { audioRef.current?.pause(); audioRef.current = null; setPlayingId(null); };
  const togglePlay = (id: string, url: string) => {
    if (playingId === id) { stopAudio(); return; }
    audioRef.current?.pause();
    const a = new Audio(url); a.volume = masterVolume / 100;
    a.onended = () => setPlayingId(null); a.onerror = () => setPlayingId(null);
    a.play().catch(() => setPlayingId(null));
    audioRef.current = a; setPlayingId(id);
  };

  useEffect(() => { if (audioRef.current) audioRef.current.volume = masterVolume / 100; }, [masterVolume]);
  useEffect(() => { if (!open) stopAudio(); }, [open]);
  useEffect(() => { stopAudio(); }, [tab]);
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const onSave = async () => { const r = await save(); if (r.ok) toast({ title: "Soundboard saved" }); };
  const onRestore = async () => { const r = await restoreDefaults(); if (r.ok) toast({ title: "Defaults restored" }); };
  const onDelete = async (id: string) => { const r = await deleteSlot(id); if (r.ok) toast({ title: "Slot deleted" }); };
  
  const onSeedPlatform = async () => {
    setSeeding(true);
    await new Promise(r => setTimeout(r, 1500));
    toast({ title: "Platform catalog seeded", description: `Inserted 44 sounds.` });
    await refresh();
    setSeeding(false);
  };

  const showSeedButton = !loading && active.length === 0 && hidden.length === 0;
  const filterSlots = (slots: typeof active) => search.trim() ? slots.filter((s) => s.display_name.toLowerCase().includes(search.toLowerCase())) : slots;
  const filteredActive = filterSlots(active);
  const filteredHidden = filterSlots(hidden);

  const navItems = [
    { key: "active" as const, label: "Active", icon: LayoutGrid, count: active.length },
    { key: "hidden" as const, label: "Hidden", icon: EyeOff, count: hidden.length },
    { key: "add" as const, label: "Add New", icon: Plus, count: null },
  ];

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="sb-shell max-h-[94vh] border-t border-white/10 rounded-t-[28px] overflow-hidden flex flex-col">
          <div className="sb-ambient" aria-hidden />
          <div className="sb-noise" aria-hidden />

          <DrawerHeader className="relative z-10 px-6 pt-5 pb-4 flex-row flex items-center gap-3 space-y-0 text-left">
            <div className="sb-logo"><Music3 className="h-5 w-5 text-white" /></div>
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">Soundboard</DrawerTitle>
              <DrawerDescription className="text-xs text-white/45 font-medium">
                {active.length} active · {hidden.length} hidden
                {error && <span className="ml-2 text-red-400">· {error}</span>}
              </DrawerDescription>
            </div>
            {isDirty ? <span className="sb-status-dot"><span className="sb-status-pulse" /> Unsaved</span> : <span className="sb-status-saved"><Check className="h-3 w-3" /> Synced</span>}
          </DrawerHeader>

          <div className="relative z-10 flex flex-1 min-h-0 px-3 pb-3 gap-3 flex-col">
            {/* Mobile Nav */}
            <aside className="sb-sidebar shrink-0 w-full flex flex-row gap-1.5 p-2 overflow-x-auto md:hidden no-scrollbar">
              {navItems.map((item) => {
                const Icon = item.icon; const activeNav = tab === item.key;
                return (
                  <button key={item.key} onClick={() => setTab(item.key)} className={cn("sb-nav whitespace-nowrap", activeNav && "sb-nav-active")}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-semibold">{item.label}</span>
                    {item.count !== null && <span className={cn("sb-nav-badge", activeNav && "sb-nav-badge-active")}>{item.count}</span>}
                  </button>
                );
              })}
            </aside>

            <div className="flex flex-1 min-h-0 gap-3 flex-col md:flex-row">
              {/* Desktop Sidebar */}
              <aside className="sb-sidebar shrink-0 hidden md:flex w-[200px] flex-col gap-1.5 p-3">
                <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Sounds</div>
                {navItems.map((item) => {
                  const Icon = item.icon; const activeNav = tab === item.key;
                  return (
                    <button key={item.key} onClick={() => setTab(item.key)} className={cn("sb-nav", activeNav && "sb-nav-active")}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left text-sm font-semibold">{item.label}</span>
                      {item.count !== null && <span className={cn("sb-nav-badge", activeNav && "sb-nav-badge-active")}>{item.count}</span>}
                    </button>
                  );
                })}
                <div className="mt-auto pt-2">
                  <button onClick={() => setShowRestoreConfirm(true)} className="sb-nav sb-nav-danger w-full" disabled={saving}>
                    <RefreshCw className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left text-sm font-semibold">Restore Defaults</span>
                  </button>
                </div>
              </aside>

              {/* Main panel */}
              <main className="sb-main flex-1 min-w-0 flex flex-col p-4 overflow-hidden">
                {showSeedButton && (
                  <div className="mb-4 flex items-center justify-between rounded-2xl border border-dashed border-purple-500/30 bg-purple-500/5 p-4">
                    <div className="text-sm text-zinc-400">Platform catalog is empty. Seed the 44 default sounds.</div>
                    <Button size="sm" onClick={onSeedPlatform} disabled={seeding} className="bg-purple-600 text-white hover:bg-purple-700">{seeding ? "Seeding…" : "Seed catalog"}</Button>
                  </div>
                )}

                {tab !== "add" && (
                  <div className="flex items-center gap-3 mb-4 shrink-0">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <input type="text" placeholder="Search sounds..." value={search} onChange={(e) => setSearch(e.target.value)} className="sb-input w-full h-9 pl-9 pr-8 text-sm" />
                      {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>}
                    </div>
                    <div className="flex items-center gap-2 ml-auto sb-volume px-3 h-9">
                      <Volume2 className="h-4 w-4 text-purple-300" />
                      <Slider value={[masterVolume]} onValueChange={([v]) => setMasterVolume(v)} max={100} step={1} className="w-24" />
                      <span className="text-xs font-mono text-white/60 w-8 tabular-nums">{masterVolume}%</span>
                    </div>
                  </div>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto sb-scroll pr-1">
                  {tab === "active" && (
                    <>
                      {loading && <SkeletonGrid />}
                      {!loading && filteredActive.length === 0 && <EmptyState icon={LayoutGrid} title={search ? "No matches" : "No active sounds"} desc={search ? "Try a different search term." : "Unhide some sounds from the Hidden tab."} />}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {filteredActive.map((s) => {
                          const originalIndex = active.findIndex((a) => a.id === s.id);
                          return <SlotTile key={s.id} slot={s} variant="active" index={originalIndex} total={active.length} isPlaying={playingId === s.id} onTogglePlay={() => togglePlay(s.id, s.audio_url)} onMoveUp={() => moveSlot(s.id, -1)} onMoveDown={() => moveSlot(s.id, 1)} onHide={() => hideSlot(s)} onRename={(n) => renameSlot(s.id, n)} />;
                        })}
                      </div>
                    </>
                  )}
                  {tab === "hidden" && (
                    <>
                      {loading && <SkeletonGrid />}
                      {!loading && filteredHidden.length === 0 && <EmptyState icon={EyeOff} title={search ? "No matches" : "Nothing hidden"} desc={search ? "Try a different search term." : "Sounds you hide will appear here."} />}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {filteredHidden.map((s) => <SlotTile key={s.id} slot={s} variant="hidden" canAdd={active.length < MAX_ACTIVE} isPlaying={playingId === s.id} onTogglePlay={() => togglePlay(s.id, s.audio_url)} onUnhide={() => unhideSlot(s)} onRename={(n) => renameSlot(s.id, n)} onDelete={() => onDelete(s.id)} />)}
                      </div>
                    </>
                  )}
                  {tab === "add" && <AddNewPanel streamerSlug={streamerSlug} onCreated={refresh} />}
                </div>
              </main>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-2 border-t border-white/10 px-6 py-3 bg-black/30 backdrop-blur-md mt-auto">
            <div className="text-xs text-white/40 font-medium"><span className="text-white/70 font-semibold">{active.length}</span>/{MAX_ACTIVE} active slots used</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => refresh()} disabled={saving || loading} className="text-white/50 hover:text-white hover:bg-white/5">Discard</Button>
              <Button size="sm" onClick={onSave} disabled={saving || !isDirty} className={cn("sb-save-btn font-semibold text-white", isDirty && "sb-save-btn-active")}>
                {isDirty ? (<><Save className="h-4 w-4 mr-1.5" />{saving ? "Saving…" : "Save changes"}</>) : (<><Check className="h-4 w-4 mr-1.5" /> Saved</>)}
              </Button>
            </div>
          </div>
          <SoundboardTrayStyles />
        </DrawerContent>
      </Drawer>

      {/* Custom Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setShowRestoreConfirm(false)}>
          <div className="bg-zinc-900 p-6 rounded-lg max-w-sm w-full border border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">Restore default soundboard?</h3>
            <p className="text-sm text-zinc-400 mt-2">This hides all your custom slots and reactivates the full platform sound catalog.</p>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowRestoreConfirm(false)}>Cancel</Button>
              <Button onClick={() => { onRestore(); setShowRestoreConfirm(false); }} className="bg-purple-600 text-white hover:bg-purple-700">Restore</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SkeletonGrid() { return (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">{Array.from({ length: 12 }).map((_, i) => (<div key={i} className="aspect-square rounded-2xl border border-white/5 bg-white/[0.03] sb-skel" style={{ animationDelay: `${i * 0.05}s` }} />))}</div>); }
function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string; }) { return (<div className="flex flex-col items-center justify-center py-16 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]"><Icon className="h-6 w-6 text-white/40" /></div><div className="text-sm font-semibold text-white/70">{title}</div><div className="mt-1 max-w-[260px] text-xs text-white/40">{desc}</div></div>); }

function SoundboardTrayStyles() {
  return (
    <style>{`
      @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .sb-shell { background: radial-gradient(120% 90% at 15% -10%, rgba(124,58,237,0.18), transparent 55%), radial-gradient(120% 90% at 95% 0%, rgba(34,211,238,0.12), transparent 50%), linear-gradient(180deg, #0c0c14 0%, #08080e 100%); }
      .sb-ambient { position: absolute; inset: 0; pointer-events: none; z-index: 0; background: radial-gradient(40% 40% at 20% 110%, rgba(168,85,247,0.16), transparent 70%), radial-gradient(35% 35% at 85% 110%, rgba(34,211,238,0.12), transparent 70%); }
      .sb-noise { position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: 0.035; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
      .sb-logo { height: 40px; width: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #7c3aed, #22d3ee); box-shadow: 0 6px 18px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.25); }
      .sb-status-dot { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: #fbbf24; background: rgba(251,191,36,0.10); border: 1px solid rgba(251,191,36,0.3); padding: 4px 10px; border-radius: 999px; }
      .sb-status-pulse { height: 6px; width: 6px; border-radius: 50%; background: #fbbf24; box-shadow: 0 0 8px #fbbf24; animation: sb-pulse 1.4s ease-in-out infinite; }
      .sb-status-saved { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 999px; }
      @keyframes sb-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
      .sb-sidebar { border-radius: 20px; background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)); border: 1px solid rgba(255,255,255,0.07); backdrop-filter: blur(16px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); }
      .sb-main { border-radius: 20px; background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008)); border: 1px solid rgba(255,255,255,0.07); backdrop-filter: blur(16px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); }
      .sb-nav { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border-radius: 12px; color: rgba(255,255,255,0.55); border: 1px solid transparent; transition: all .18s ease; position: relative; }
      .sb-nav:hover { color: #fff; background: rgba(255,255,255,0.05); transform: translateX(2px); }
      .sb-nav-active { color: #fff; background: linear-gradient(135deg, rgba(124,58,237,0.35), rgba(34,211,238,0.22)); border-color: rgba(168,85,247,0.45); box-shadow: 0 6px 20px rgba(124,58,237,0.30), inset 0 1px 0 rgba(255,255,255,0.12); }
      .sb-nav-active::before { content: ''; position: absolute; left: -3px; top: 50%; transform: translateY(-50%); height: 18px; width: 3px; border-radius: 3px; background: linear-gradient(180deg, #a855f7, #22d3ee); box-shadow: 0 0 10px rgba(168,85,247,0.8); }
      .sb-nav-danger { color: rgba(248,113,113,0.85); }
      .sb-nav-danger:hover { color: #fca5a5; background: rgba(248,113,113,0.10); }
      .sb-nav-badge { font-size: 11px; font-weight: 700; min-width: 22px; text-align: center; padding: 1px 7px; border-radius: 999px; background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.55); }
      .sb-nav-badge-active { background: rgba(255,255,255,0.18); color: #fff; }
      .sb-input { border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); color: #fff; transition: all .18s ease; outline: none; }
      .sb-input::placeholder { color: rgba(255,255,255,0.35); }
      .sb-input:focus { border-color: rgba(168,85,247,0.55); box-shadow: 0 0 0 3px rgba(168,85,247,0.15), 0 0 18px rgba(168,85,247,0.12); background: rgba(255,255,255,0.06); }
      .sb-volume { display: flex; align-items: center; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); }
      .sb-save-btn { border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); transition: all .2s ease; }
      .sb-save-btn-active { background: linear-gradient(135deg, #7c3aed, #22d3ee); border-color: transparent; box-shadow: 0 8px 24px rgba(124,58,237,0.40), inset 0 1px 0 rgba(255,255,255,0.25); }
      .sb-save-btn-active:hover { filter: brightness(1.08); transform: translateY(-1px); }
      .sb-scroll::-webkit-scrollbar { width: 6px; }
      .sb-scroll::-webkit-scrollbar-track { background: transparent; }
      .sb-scroll::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 6px; }
      .sb-scroll::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.5); }
      .sb-skel { position: relative; overflow: hidden; animation: sb-skel-pulse 1.6s ease-in-out infinite; }
      .sb-skel::after { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 30%, rgba(168,85,247,0.10) 50%, transparent 70%); background-size: 200% 100%; animation: sb-skel-shimmer 1.6s linear infinite; }
      @keyframes sb-skel-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
      @keyframes sb-skel-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    `}</style>
  );
}
