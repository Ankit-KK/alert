import { useState, useEffect, useCallback } from 'react';
import type { SoundboardSlot } from '../types';
import { MOCK_ACTIVE, MOCK_HIDDEN } from '../mockData';

const MAX_ACTIVE = 24;

export function useSoundboardMock(streamerSlug: string) {
  const [active, setActive] = useState<SoundboardSlot[]>([]);
  const [hidden, setHidden] = useState<SoundboardSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [stagedActive, setStagedActive] = useState<SoundboardSlot[]>([]);
  const [stagedHidden, setStagedHidden] = useState<SoundboardSlot[]>([]);

  const isDirty = JSON.stringify(stagedActive) !== JSON.stringify(active) || 
                  JSON.stringify(stagedHidden) !== JSON.stringify(hidden);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setActive(MOCK_ACTIVE);
      setHidden(MOCK_HIDDEN);
      setStagedActive(MOCK_ACTIVE);
      setStagedHidden(MOCK_HIDDEN);
      setLoading(false);
    }, 800);
  }, [streamerSlug]);

  const refresh = useCallback(() => {
    setStagedActive(active);
    setStagedHidden(hidden);
    setError(null);
  }, [active, hidden]);

  const hideSlot = useCallback((slot: SoundboardSlot) => {
    setStagedActive(prev => prev.filter(s => s.id !== slot.id));
    setStagedHidden(prev => [...prev, { ...slot, is_visible: false, order_index: null }]);
  }, []);

  const unhideSlot = useCallback((slot: SoundboardSlot) => {
    if (stagedActive.length >= MAX_ACTIVE) return;
    const newOrder = stagedActive.length;
    setStagedHidden(prev => prev.filter(s => s.id !== slot.id));
    setStagedActive(prev => [...prev, { ...slot, is_visible: true, order_index: newOrder }]);
  }, [stagedActive.length]);

  const moveSlot = useCallback((id: string, direction: -1 | 1) => {
    setStagedActive(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const newArr = [...prev];
      const temp = newArr[idx];
      newArr[idx] = newArr[newIdx];
      newArr[newIdx] = temp;
      return newArr.map((s, i) => ({ ...s, order_index: i }));
    });
  }, []);

  const renameSlot = useCallback((id: string, newName: string) => {
    const updateName = (arr: SoundboardSlot[]) => arr.map(s => s.id === id ? { ...s, display_name: newName } : s);
    setStagedActive(prev => updateName(prev));
    setStagedHidden(prev => updateName(prev));
  }, []);

  const deleteSlot = useCallback(async (id: string) => {
    setStagedHidden(prev => prev.filter(s => s.id !== id));
    return { ok: true };
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000)); 
    setActive(stagedActive);
    setHidden(stagedHidden);
    setSaving(false);
    return { ok: true, error: null };
  }, [stagedActive, stagedHidden]);

  const restoreDefaults = useCallback(async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    const newActive = MOCK_ACTIVE.filter(s => s.source === 'platform');
    const newHidden = [
      ...MOCK_HIDDEN,
      ...MOCK_ACTIVE.filter(s => s.source === 'custom').map(s => ({ ...s, is_visible: false, order_index: null }))
    ];
    setActive(newActive);
    setHidden(newHidden);
    setStagedActive(newActive);
    setStagedHidden(newHidden);
    setSaving(false);
    return { ok: true, error: null };
  }, []);

  return {
    active: stagedActive, hidden: stagedHidden, loading, saving, error, isDirty, MAX_ACTIVE,
    refresh, hideSlot, unhideSlot, moveSlot, renameSlot, save, restoreDefaults, deleteSlot,
  };
}
