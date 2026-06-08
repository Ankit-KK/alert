import type { SoundboardSlot } from './types';

export const MOCK_ACTIVE: SoundboardSlot[] = [
  { id: '1', source: 'platform', is_visible: true, order_index: 0, platform_slot_id: 'p1', display_name: 'Air Horn', audio_url: '#', audio_duration_s: 2.5, image_url: 'https://picsum.photos/seed/airhorn/200', image_type: 'png', default_order_index: 0 },
  { id: '2', source: 'platform', is_visible: true, order_index: 1, platform_slot_id: 'p2', display_name: 'Wow', audio_url: '#', audio_duration_s: 1.2, image_url: 'https://picsum.photos/seed/wow/200', image_type: 'png', default_order_index: 1 },
  { id: '3', source: 'platform', is_visible: true, order_index: 2, platform_slot_id: 'p3', display_name: 'Applause', audio_url: '#', audio_duration_s: 4.0, image_url: 'https://picsum.photos/seed/applause/200', image_type: 'png', default_order_index: 2 },
  { id: '4', source: 'custom', is_visible: true, order_index: 3, platform_slot_id: null, display_name: 'Custom Laugh', audio_url: '#', audio_duration_s: 3.1, image_url: 'https://picsum.photos/seed/laugh/200', image_type: 'jpg', default_order_index: null },
  { id: '5', source: 'platform', is_visible: true, order_index: 4, platform_slot_id: 'p4', display_name: 'Sad Trombone', audio_url: '#', audio_duration_s: 5.5, image_url: 'https://picsum.photos/seed/sad/200', image_type: 'png', default_order_index: 3 },
  { id: '6', source: 'platform', is_visible: true, order_index: 5, platform_slot_id: 'p5', display_name: 'Cricket', audio_url: '#', audio_duration_s: 2.0, image_url: 'https://picsum.photos/seed/cricket/200', image_type: 'png', default_order_index: 4 },
];

export const MOCK_HIDDEN: SoundboardSlot[] = [
  { id: '7', source: 'platform', is_visible: false, order_index: null, platform_slot_id: 'p6', display_name: 'Glass Break', audio_url: '#', audio_duration_s: 1.8, image_url: 'https://picsum.photos/seed/glass/200', image_type: 'png', default_order_index: 5 },
  { id: '8', source: 'custom', is_visible: false, order_index: null, platform_slot_id: null, display_name: 'Old Custom Sound', audio_url: '#', audio_duration_s: 6.2, image_url: 'https://picsum.photos/seed/old/200', image_type: 'webp', default_order_index: null },
];
