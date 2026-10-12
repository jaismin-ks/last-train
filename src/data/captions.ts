/**
 * Instruction captions shown at the bottom of the screen, like subtitles.
 * `text` is the instruction, `sub` an optional smaller line (controls).
 * Edit the wording here.
 */
export const CAPTIONS = {
  phone: {
    unlock: { text: 'Swipe up to unlock your phone' },
    textMom: { text: "Text Mom that you're done for the night", sub: 'Tap the message field' },
    sendFirst: { text: 'Send it', sub: 'Tap the send button' },
    reply: { text: 'Reply to Mom', sub: 'Tap the message field' },
    sendReply: { text: 'Send it', sub: 'Tap the send button' },
  },
  station: {
    findPlatform: { text: 'Find your platform', sub: 'Hold W to walk  ·  S to step back' },
  },
  street: {
    // shown once when you land, like a film chapter heading
    location: { time: '11:58 PM', place: '25 St.' },
    findSubway: { text: 'Find the subway entrance', sub: 'Hold W to walk  ·  Move the mouse to look' },
  },
}

/** How long street captions stay up after you start walking (seconds). */
export const STREET_CAPTION_TIME = 6

/**
 * Inner thoughts: rare lines in her voice. `at` is how far along the walk
 * (0 = start, 1 = subway); glance thoughts play right after each look back.
 */
export const THOUGHTS = {
  afterGlance: ['Was someone there?', 'Just keep walking.'],
  along: [{ at: 0.93, text: 'Almost there.' }],
  duration: 3.2, // seconds on screen
}

/** Support resources, shown in the pause menu. Verify numbers before launch. */
export const RESOURCES = [
  { name: "Assaulted Women's Helpline (Ontario)", contact: '1-866-863-0511' },
  { name: 'Kids Help Phone', contact: '1-800-668-6868 · text 686868' },
  { name: 'Toronto Rape Crisis Centre', contact: '416-597-8808' },
]
