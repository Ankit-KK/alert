export type SoundboardSource = 'platform' | 'custom';
export type SoundboardImageType = 'gif' | 'png' | 'jpg' | 'webp';

export interface SoundboardSlot {
  id: string;
  source: SoundboardSource;
  is_visible: boolean;
  order_index: number | null;
  platform_slot_id: string | null;
  display_name: string;
  audio_url: string;
  audio_duration_s: number;
  image_url: string;
  image_type: SoundboardImageType;
  default_order_index: number | null;
}
