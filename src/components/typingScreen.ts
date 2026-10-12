import { CanvasTexture, SRGBColorSpace } from 'three'
import { SCREEN_H, SCREEN_W } from '../data/phoneScreens'

/**
 * Draws a typing animation on top of a phone screen image:
 * the typed text in the message field, a blinking caret,
 * and the key being pressed lit up on the keyboard.
 *
 * All positions are Figma px and match phone-screens.scripter.ts.
 */
const PX = 3 // exported @3x
const FIELD = { x: 52, y: 508, w: 323, h: 36 }
const TEXT_X = FIELD.x + 14
const KB_Y = SCREEN_H - 300
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const KEY = { w: 33, h: 42, gap: 6 }
const SPACE = { x: 99, y: KB_Y + 172, w: 193, h: 42 }
const SEND = { cx: FIELD.x + FIELD.w - 18, cy: FIELD.y + FIELD.h / 2, r: 14 }
const FONT = '17px Inter, -apple-system, "SF Pro Text", system-ui, sans-serif'

function keyRect(ch: string) {
  if (ch === ' ') return SPACE
  const lower = ch.toLowerCase()
  for (let r = 0; r < ROWS.length; r++) {
    const i = ROWS[r].indexOf(lower)
    if (i === -1) continue
    const total = ROWS[r].length * KEY.w + (ROWS[r].length - 1) * KEY.gap
    return { x: (SCREEN_W - total) / 2 + i * (KEY.w + KEY.gap), y: KB_Y + 10 + r * 54, w: KEY.w, h: KEY.h }
  }
  return null
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

/** Blue circle with a centred up arrow, matching the Figma send button. */
function drawSendButton(ctx: CanvasRenderingContext2D) {
  const { cx, cy, r } = SEND
  ctx.fillStyle = '#0A84FF'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2.6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx, cy + 6)
  ctx.lineTo(cx, cy - 6)
  ctx.moveTo(cx - 5.5, cy - 0.5)
  ctx.lineTo(cx, cy - 6)
  ctx.lineTo(cx + 5.5, cy - 0.5)
  ctx.stroke()
}

export function createTypingScreen() {
  const canvas = document.createElement('canvas')
  canvas.width = SCREEN_W * PX
  canvas.height = SCREEN_H * PX
  const ctx = canvas.getContext('2d')!
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace

  /**
   * Redraws the screen with `typed` in the field; `pressed` is the key held down.
   * `showSend` draws the blue send button once there is text to send.
   */
  function draw(
    base: CanvasImageSource,
    typed: string,
    pressed: string | null,
    caretOn: boolean,
    showSend = typed.length > 0,
  ) {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(base, 0, 0, canvas.width, canvas.height)
    ctx.setTransform(PX, 0, 0, PX, 0, 0)

    // Cover the "iMessage" placeholder inside the field
    ctx.fillStyle = '#000'
    ctx.fillRect(FIELD.x + 6, FIELD.y + 3, FIELD.w - 12, FIELD.h - 6)

    // Typed text + caret
    ctx.font = FONT
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    const midY = FIELD.y + FIELD.h / 2
    ctx.fillText(typed, TEXT_X, midY)
    if (caretOn) {
      ctx.fillStyle = '#0A84FF'
      const cx = TEXT_X + ctx.measureText(typed).width + 1
      ctx.fillRect(cx, midY - 10, 2, 20)
    }

    if (showSend) drawSendButton(ctx)

    // Pressed key: lighter key + popup bubble with the letter
    const k = pressed ? keyRect(pressed) : null
    if (k && pressed) {
      ctx.fillStyle = '#9A9A9E'
      roundRect(ctx, k.x, k.y, k.w, k.h, 5)
      if (pressed !== ' ') {
        ctx.fillStyle = '#6B6B6B'
        roundRect(ctx, k.x - 6, k.y - 54, k.w + 12, 52, 8)
        ctx.fillStyle = '#fff'
        ctx.font = '28px Inter, -apple-system, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(pressed, k.x + k.w / 2, k.y - 28) // lowercase, matches the keyboard
        ctx.textAlign = 'left'
      }
    }
    texture.needsUpdate = true
  }

  return { texture, draw, dispose: () => texture.dispose() }
}
