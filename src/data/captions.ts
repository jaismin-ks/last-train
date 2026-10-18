/**
 * Instruction captions shown at the bottom of the screen, like subtitles.
 * `text` is the instruction, `sub` an optional smaller line (controls).
 * Edit the wording here.
 */
import { isTouch } from '../systems/device'

const WALK_HINT = isTouch ? 'Push the right stick to walk  ·  all the way to run' : 'Hold W to keep walking  ·  Shift to run'
const ROAM_HINT = isTouch ? 'Right stick to move  ·  drag with your other thumb to look' : 'WASD to move  ·  Mouse to look'

export const CAPTIONS = {
  /** On the black between scenes, while the next one gets ready (only seen if that takes a moment). */
  loading: {
    station: 'Entering the station',
    train: 'Boarding the train',
  },
  phone: {
    unlock: { text: 'Swipe up to unlock your phone' },
    textMom: { text: "Text Mom that you're done for the night", sub: 'Tap the message field' },
    sendFirst: { text: 'Send it', sub: 'Tap the send button' },
    reply: { text: 'Reply to Mom', sub: 'Tap the message field' },
    sendReply: { text: 'Send it', sub: 'Tap the send button' },
  },
  station: {
    findPlatform: { text: 'Get to the platform', sub: WALK_HINT },
    onPlatform: { text: 'Wait for the train', sub: ROAM_HINT },
    // once the gate is down behind you: why the station is empty
    closedAnnouncement: {
      text: '"This station is now closed. The last southbound train will arrive shortly."',
      sub: 'Announcement',
    },
  },
  street: {
    // shown once when you land, like a film chapter heading
    location: { time: '11:58 PM', place: 'Delmont St. W' }, // made up, Toronto-style
    findSubway: { text: 'Get to the station before it closes', sub: WALK_HINT },
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

/**
 * Support lines on the resources screen, grouped. `href` makes them tappable on
 * phones (tel: / sms:). Numbers checked against each service's own site, Oct 2026.
 */
export type Resource = { name: string; contact: string; href?: string; note: string; url: string }
export const RESOURCE_GROUPS: { title: string; items: Resource[] }[] = [
  {
    title: 'Toronto & Ontario',
    items: [
      { name: "Assaulted Women's Helpline", contact: '1-866-863-0511', href: 'tel:18668630511', note: '24/7, free, confidential, across Ontario', url: 'https://www.awhl.org/' },
      { name: 'Toronto Rape Crisis Centre', contact: '416-597-8808', href: 'tel:4165978808', note: '24-hour crisis line', url: 'https://trccmwar.ca/' },
    ],
  },
  {
    title: 'On the TTC',
    items: [
      { name: 'SafeTTC', contact: 'text 647-496-1940 · SafeTTC app', href: 'sms:16474961940', note: 'report harassment straight to Transit Control', url: 'https://www.ttc.ca/riding-the-ttc/safety-and-security/safe-ttc-app' },
      { name: 'Designated Waiting Areas', contact: 'on every subway platform', note: 'an intercom to TTC staff while you wait', url: 'https://www.ttc.ca/riding-the-ttc/safety-and-security/Designated-Waiting-Area-DWA' },
    ],
  },
  {
    title: 'Across Canada',
    items: [
      { name: '9-8-8 Suicide Crisis Helpline', contact: 'call or text 988', href: 'tel:988', note: '24/7, free, English and French', url: 'https://988.ca/' },
      { name: 'Kids Help Phone', contact: '1-800-668-6868 · text 686868', href: 'tel:18006686868', note: 'for young people, 24/7', url: 'https://kidshelpphone.ca/' },
      { name: 'Hope for Wellness Help Line', contact: '1-855-242-3310', href: 'tel:18552423310', note: 'for Indigenous peoples, 24/7, also online chat', url: 'https://www.hopeforwellness.ca/' },
    ],
  },
  {
    title: 'Outside Canada',
    items: [
      { name: 'Find A Helpline', contact: 'findahelpline.com', href: 'https://findahelpline.com/', note: 'free, confidential support lines in your country', url: 'https://findahelpline.com/' },
    ],
  },
]
export const RESOURCES = RESOURCE_GROUPS.flatMap((g) => g.items)

/** Copy for the resources screen (reached from the content warning, the pause menu, or the end). */
export const RESOURCES_SCREEN = {
  title: "You're not alone.",
  lede: 'If anything here stayed with you, or felt familiar, these people are there to listen.',
  emergency: 'If you are in danger right now, call\u00a0911, or your local emergency number.', // \u00a0 keeps "call 911" on one line
}

/**
 * The red button at the end of the resources screen: one press per person,
 * counted for everyone. Pressed, it shows how many people have, and the
 * `after` line appears under it.
 */
export const SUPPORT = {
  ask: 'Been through something like this, or know someone who has?',
  button: 'Show support',
  pressed: (n: number) => `${n.toLocaleString()} ${n === 1 ? 'person' : 'people'}`,
  after: 'We stand together against harassment and violence.',
}
