/**
 * The ending, after the doors open at your stop and it cuts to black.
 * Screens play in order; each fades in, holds, and fades out. Click or press a
 * key to move on sooner. Then the resources screen.
 *
 * Check every number at its source before launch (links below).
 */
export const ENDING = {
  fade: 1.4, // seconds to fade each screen in / out
  startDelay: 2, // black, before anything appears

  /** The chat with Mom from the phone scene, and the text home. */
  chat: {
    earlier: [
      { from: 'mom', text: 'Text me when you get home ❤️' },
      { from: 'me', text: 'will do 👍' },
    ] as { from: 'mom' | 'me'; text: string }[],
    earlierTime: 'Today 11:52 PM',
    nowTime: '12:31 AM',
    typeDelay: 2.2, // seconds before you start typing
    perLetter: 0.28,
    hold: 3.5, // after "Delivered" (or after the typing stops)
  },

  /**
   * How it ends depends on where she got off:
   *   followed   she got off early and he followed: the text is never sent
   *   ambiguous  she stayed on to her stop and got home: it sends
   */
  kinds: {
    followed: {
      typed: 'mom',
      send: false,
      jess: 'are you okay? do you want me to pick you up?',
      opening: [['Maya got off early.'], ['So did he.']],
    },
    ambiguous: {
      typed: 'just got home ❤️',
      send: true,
      jess: 'are you okay? do you want me to pick you up?',
      opening: [['Maya got home that night.'], ['Many don’t.']],
    },
  } as Record<'followed' | 'ambiguous', { typed: string; send: boolean; jess: string; opening: string[][] }>,

  /** After the opening lines (above, per ending), these screens, one at a time (seconds on screen). */
  screens: [
    {
      lines: [
        'In one year, 629,000 women and 211,000 men in Canada said the worst unwanted sexual behaviour they experienced in public happened on public transit.',
      ],
      source: 'Statistics Canada, Survey of Safety in Public and Private Spaces, 2018',
      url: 'https://www150.statcan.gc.ca/n1/pub/85-002-x/2019001/article/00017-eng.htm',
      hold: 7,
    },
    {
      lines: ['In Toronto, 59% of women have experienced unwanted sexual looks or gestures on transit.'],
      source: 'WomanACT / Angus Reid, 2022',
      url: 'https://www.newswire.ca/news-releases/womanact-and-angus-reid-group-public-transit-poll-86-of-people-have-experienced-harassment-on-toronto-s-public-transit-system-871449762.html',
      hold: 6,
    },
    {
      lines: ['Nearly a third of sexual assault victims in Canada are 12 to 17 years old.'],
      source: 'Statistics Canada, police-reported data, 2022',
      url: 'https://www150.statcan.gc.ca/n1/pub/85-002-x/2024001/article/00006-eng.htm',
      hold: 6,
    },
    {
      lines: ['Only 6% of sexual assaults are reported to police.'],
      source: 'Statistics Canada, 2024',
      url: 'https://www150.statcan.gc.ca/n1/pub/11-627-m/11-627-m2024051-eng.htm',
      hold: 6,
    },
    { lines: ['Text me when you get home.'], hold: 5, final: true },
  ] as { lines: string[]; source?: string; url?: string; hold: number; final?: boolean }[],
}
