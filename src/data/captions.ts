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
    findPlatform: { text: 'Get to the platform', sub: 'Hold W to keep walking  ·  Shift to run' },
    onPlatform: { text: 'Wait for the train', sub: 'WASD to move  ·  Mouse to look' },
    // once the gate is down behind you: why the station is empty
    closedAnnouncement: {
      text: '"This station is now closed. The last southbound train will arrive shortly."',
      sub: 'Announcement',
    },
  },
  street: {
    // shown once when you land, like a film chapter heading
    location: { time: '11:58 PM', place: '25 St.' },
    findSubway: { text: 'Get to the station before it closes', sub: 'Hold W to keep walking  ·  Shift to run' },
  },
}

/** How long street captions stay up after you start walking (seconds). */
export const STREET_CAPTION_TIME = 8

/**
 * Inner thoughts: rare lines in her voice. `at` is how far along the walk
 * (0 = start, 1 = subway); glance thoughts play right after each look back.
 */
export const THOUGHTS = {
  afterGlance: ['Was someone there?', 'Just keep walking.'],
  along: [{ at: 0.93, text: 'Almost there.' }],
  duration: 3.2, // seconds on screen (longer lines stay a little longer)
  gateClosed: 'They’ve closed the gates behind me.',
}

/** Support resources, shown in the pause menu. Verify numbers before launch. */
/** Support lines shown on the resources screen (tel: makes them tappable on phones). */
export const RESOURCES = [
  { name: "Assaulted Women's Helpline (Ontario)", contact: '1-866-863-0511', tel: '18668630511', note: '24/7, free, confidential', url: 'https://www.awhl.org/' },
  { name: 'Toronto Rape Crisis Centre', contact: '416-597-8808', tel: '4165978808', note: '24-hour crisis line', url: 'https://trccmwar.ca/' },
  { name: 'Kids Help Phone', contact: '1-800-668-6868 · text 686868', tel: '18006686868', note: 'for young people, 24/7', url: 'https://kidshelpphone.ca/' },
]

/** Copy for the resources screen (reached from the content warning, the pause menu, or the end). */
export const RESOURCES_SCREEN = {
  title: "You're not alone.",
  lede: 'If anything here stayed with you, or felt familiar, these people are there to listen.',
  emergency: 'If you are in danger right now, call 911.',
}
