/**
 * Homepage content configuration.
 *
 * Copy lives here so sections stay presentational. Every demo string below is
 * original sample content written for this page — handles and messages are
 * fictional and exist only to illustrate interactions.
 */

/** The existing public HyperChat product site. */
export const PRODUCT_URL = 'https://hyperchat.space/'

export type SectionId = 'top' | 'features' | 'experience' | 'soundboard' | 'visuals' | 'control' | 'how-it-works' | 'story' | 'get-started'

export interface NavItem {
  label: string
  href: `#${SectionId}`
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Features', href: '#features' },
  { label: 'Experience', href: '#experience' },
  { label: 'How It Works', href: '#how-it-works' },
]

export const HERO = {
  eyebrow: 'Interactive livestreaming',
  headline: ['Make every', 'moment', 'interactive.'],
  description:
    'Turn live moments into unforgettable experiences with expressive audio, dynamic visuals, and real-time interactions built for creators.',
  primary: { label: 'Explore HyperChat', href: '#features' },
  secondary: { label: 'See It in Action', href: '#experience' },
} as const

export interface Capability {
  index: string
  title: string
  body: string
  href: `#${SectionId}`
}

export const CAPABILITIES: Capability[] = [
  {
    index: '01',
    title: 'Voice',
    body: 'Messages that speak on stream, so your community is heard — not just read.',
    href: '#experience',
  },
  {
    index: '02',
    title: 'Sound',
    body: 'A soundboard your audience can play with, tuned and curated by you.',
    href: '#soundboard',
  },
  {
    index: '03',
    title: 'Visuals',
    body: 'GIFs, media, and on-screen alerts that land right inside your broadcast.',
    href: '#visuals',
  },
  {
    index: '04',
    title: 'Control',
    body: 'Moderation and configuration that keep every interaction on your terms.',
    href: '#control',
  },
]

export interface VoiceSample {
  id: string
  user: string
  text: string
  /** Pre-generated sample clip in /public/audio/voice. */
  src: string
  /** Name of the ElevenLabs stock voice the sample was generated with. */
  voice: string
  duration: number
  /** Normalised loudness envelope of the clip (48 bins), for the idle waveform. */
  peaks: number[]
}

/**
 * Sample voice messages. Each line was generated once with ElevenLabs text to
 * speech (stock voices) for this preview and ships as a static file; the
 * homepage never calls a voice API.
 */
export const VOICE_SAMPLES: VoiceSample[] = [
  {
    id: 'v1',
    user: 'kitecat',
    text: 'That last round was unreal! Run it back one more time!',
    src: '/audio/voice/kitecat.mp3',
    voice: 'Jessica',
    duration: 4.12,
    peaks: [0.22, 0.69, 0.83, 0.41, 0.56, 0.83, 0.57, 0.09, 0.45, 0.9, 0.75, 0.37, 0.53, 0.32, 0.06, 0.7, 0.71, 0.41, 0.3, 0.16, 0.14, 0.62, 0.88, 0.94, 0.81, 0.77, 0.45, 0.06, 0.07, 0.16, 0.36, 0.96, 0.85, 0.69, 0.73, 0.29, 0.28, 0.32, 1.0, 0.49, 0.72, 0.75, 0.51, 0.77, 0.46, 0.2, 0.18, 0.07],
  },
  {
    id: 'v2',
    user: 'nova_frames',
    text: 'Greetings from the night shift. This stream is keeping me awake.',
    src: '/audio/voice/nova.mp3',
    voice: 'Will',
    duration: 4.49,
    peaks: [0.24, 0.14, 0.77, 0.29, 0.06, 0.12, 0.12, 0.07, 0.06, 0.18, 0.64, 1.0, 0.8, 0.67, 0.34, 0.84, 0.82, 0.89, 0.81, 0.39, 0.42, 0.68, 0.25, 0.16, 0.16, 0.07, 0.06, 0.06, 0.07, 0.52, 0.2, 0.14, 0.35, 0.61, 0.58, 0.38, 0.2, 0.57, 0.32, 0.54, 0.71, 0.47, 0.34, 0.48, 0.49, 0.19, 0.31, 0.09],
  },
  {
    id: 'v3',
    user: 'mossbyte',
    text: 'Calling it now: next map is the comeback. Chat, hold me to it!',
    src: '/audio/voice/mossbyte.mp3',
    voice: 'Charlie',
    duration: 4.41,
    peaks: [0.51, 1.0, 0.72, 0.69, 0.34, 0.7, 0.47, 0.24, 0.11, 0.06, 0.06, 0.22, 0.42, 0.62, 0.24, 0.32, 0.73, 0.81, 0.1, 0.06, 0.76, 0.32, 0.66, 0.4, 0.47, 0.72, 0.58, 0.35, 0.22, 0.16, 0.11, 0.06, 0.06, 0.12, 0.84, 0.79, 0.07, 0.06, 0.06, 0.28, 0.88, 0.54, 0.69, 0.15, 0.58, 0.27, 0.07, 0.06],
  },
]

export type PadTone = 'cyan' | 'signal' | 'mint'

export interface SoundPad {
  id: string
  label: string
  key: string
  tone: PadTone
  description: string
}

/**
 * Pad sounds are short original effects generated with ElevenLabs sound
 * effects for this demo and shipped as static files in /public/audio/sfx.
 */
export const SOUND_PADS: SoundPad[] = [
  { id: 'hype', label: 'HYPE', key: '1', tone: 'signal', description: 'synth riser into a bright stab' },
  { id: 'wow', label: 'WOW', key: '2', tone: 'cyan', description: 'small crowd going “ooh”' },
  { id: 'gg', label: 'GG', key: '3', tone: 'mint', description: 'two-note arcade victory chime' },
  { id: 'clutch', label: 'CLUTCH', key: '4', tone: 'signal', description: 'deep impact with a bright whoosh' },
  { id: 'bruh', label: 'BRUH', key: '5', tone: 'cyan', description: 'deflated cartoon brass slide' },
  { id: 'cheer', label: 'CHEER', key: '6', tone: 'mint', description: 'short burst of cheering' },
]

export interface VisualState {
  id: 'message' | 'media' | 'overlay'
  step: string
  label: string
  title: string
  body: string
}

export const VISUAL_STATES: VisualState[] = [
  {
    id: 'message',
    step: '01',
    label: 'Message arrives',
    title: 'A viewer reaches out.',
    body: 'An interaction enters the stream with its sender, its words, and the moment it belongs to.',
  },
  {
    id: 'media',
    step: '02',
    label: 'Media joins in',
    title: 'The message brings a visual.',
    body: 'A GIF or media clip rides along, so a reaction can be seen as well as read.',
  },
  {
    id: 'overlay',
    step: '03',
    label: 'Overlay responds',
    title: 'Your broadcast reacts.',
    body: 'An on-screen alert animates into your overlay, framing the moment for everyone watching.',
  },
]

export interface OverlayStyle {
  id: 'minimal' | 'spotlight' | 'ticker'
  label: string
  hint: string
}

export const OVERLAY_STYLES: OverlayStyle[] = [
  { id: 'minimal', label: 'Minimal', hint: 'Compact card in a corner' },
  { id: 'spotlight', label: 'Spotlight', hint: 'Centered, larger moment' },
  { id: 'ticker', label: 'Ticker', hint: 'Slim band along the bottom' },
]

export const REVIEW_QUEUE = [
  { id: 'r1', user: 'orbit.jay', text: 'that pixel-perfect jump though', status: 'Shown' },
  { id: 'r2', user: 'lowpoly_lu', text: 'play the HYPE pad pls', status: 'Shown' },
  { id: 'r3', user: 'anon_8812', text: 'Message held — contains a blocked term', status: 'Held' },
] as const

export interface Step {
  index: string
  title: string
  body: string
}

export const STEPS: Step[] = [
  { index: '01', title: 'Create your space', body: 'Set up a personalized creator environment that feels like your channel.' },
  { index: '02', title: 'Shape the experience', body: 'Configure audio, visuals, and the interactive elements your community can use.' },
  { index: '03', title: 'Go live', body: 'Bring those interactions into your stream as on-screen, on-air moments.' },
]

export const FINAL_CTA = {
  heading: 'Ready to make some noise?',
  description: 'Build a more expressive streaming experience with HyperChat.',
  primary: { label: 'Get Started', href: PRODUCT_URL },
  secondary: { label: 'Explore Features', href: '#features' },
} as const
