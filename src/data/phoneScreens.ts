/**
 * Phone cutscene steps. Screens are Figma exports (PNG @3x) in public/assets/phone/.
 *
 * Hotspots use Figma coordinates (the frame is 393 × 852), so you can read
 * x / y / w / h straight off the Figma inspector.
 *
 *   auto    — moves on by itself after `after` seconds
 *   tap     — player clicks inside `hotspot`
 *   swipeUp — player drags upward on the screen (unlock)
 *   end     — last screen, holds, then the phone fades out into the descent
 *   tapThenType — player taps `hotspot`, `text` types itself out, then player taps `send`
 */
export const SCREEN_W = 393
export const SCREEN_H = 852

export type Hotspot = { x: number; y: number; w: number; h: number }
export type Advance =
  | { type: 'auto'; after: number }
  | { type: 'tap'; hotspot: Hotspot }
  | { type: 'swipeUp' }
  /**
   * Final screen: holds for `hold` s (or until `skip` is tapped), then the
   * phone fades to black and the descent starts.
   */
  | { type: 'end'; hold: number; skip?: Hotspot }
  /**
   * Tap `hotspot`, `text` types out letter by letter over this screen,
   * then tap `send` to move on. Drawn live, so no separate "typed" image is needed.
   */
  | { type: 'tapThenType'; hotspot: Hotspot; text: string; charsPerSecond: number; send: Hotspot }

export type PhoneStep = { file: string; advance: Advance }

export const phoneSteps: PhoneStep[] = [
  // Lock screen → drag up to unlock
  { file: '01-lock.png', advance: { type: 'swipeUp' } },
  // Chat open → tap the message field, the message types itself out, tap send
  {
    file: '02-chat-open.png',
    advance: {
      type: 'tapThenType',
      hotspot: { x: 0, y: 500, w: 393, h: 352 },
      text: 'just got off work',
      charsPerSecond: 6,
      send: { x: 333, y: 504, w: 44, h: 44 },
    },
  },
  // Sent → Delivered
  { file: '04-chat-sent.png', advance: { type: 'auto', after: 1.5 } },
  // Read, Mom is typing…
  { file: '05-chat-mom-typing.png', advance: { type: 'auto', after: 2.5 } },
  // "Text me when you get home ❤️" → tap the field, reply types out, tap send
  {
    file: '06-chat-mom-reply.png',
    advance: {
      type: 'tapThenType',
      hotspot: { x: 0, y: 500, w: 393, h: 352 },
      text: 'will do 👍',
      charsPerSecond: 5,
      send: { x: 333, y: 504, w: 44, h: 44 },
    },
  },
  // Reply sent → Delivered… a pause before the battery alert pops up
  { file: '07-chat-replied.png', advance: { type: 'auto', after: 2 } },
  // Low battery alert → continues by itself after 2 s; tapping Close skips the wait
  {
    file: '08-chat-battery.png',
    advance: { type: 'end', hold: 2, skip: { x: 61, y: 430, w: 270, h: 50 } },
  },
]

export const phoneScreenUrl = (file: string) => `/assets/phone/${file}`

/** Minimum upward drag (in Figma px) that counts as an unlock swipe. */
export const SWIPE_DISTANCE = 120

export const inHotspot = (p: { x: number; y: number }, h: Hotspot) =>
  p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h
