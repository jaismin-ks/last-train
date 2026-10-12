/**
 * Phone cutscene screens, exported from Figma as PNG @3x into
 * public/assets/phone/. Keep the file names below in sync with your exports.
 * `duration` is how long each screen holds (seconds) before the next one.
 */
export const phoneScreens = [
  { file: '01-lock.png', duration: 3 },
  { file: '02-chat-open.png', duration: 2 },
  { file: '03-chat-typing.png', duration: 2.5 },
  { file: '04-chat-sent.png', duration: 1.5 },
  { file: '05-chat-mom-typing.png', duration: 2 },
  { file: '06-chat-mom-reply.png', duration: 3 },
  { file: '07-chat-battery.png', duration: 3 },
] as const

export const phoneScreenUrl = (file: string) => `/assets/phone/${file}`
