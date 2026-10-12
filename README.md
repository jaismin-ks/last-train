# Last Train

An interactive short film for the browser about being alone at night.
Built with Vite, React, React Three Fiber and Theatre.js.

## Run it

```bash
npm install
npm run dev
```

In dev mode the Theatre.js studio opens on top of the scene for animating.

## Where to put assets

Everything under `public/assets/` is served as-is at `/assets/...`.

| Folder | What goes there | Format |
| --- | --- | --- |
| `public/assets/models/` | Optimised scenes and props (street, platform, carriage, phone, figure) | `.glb` (Draco/KTX2-compressed) |
| `public/assets/textures/` | Standalone textures (decals, posters, signs) | `.webp`, `.ktx2` |
| `public/assets/hdri/` | Night sky / environment maps | `.hdr`, `.exr` (keep small, 1K–2K) |
| `public/assets/phone/` | Phone screens exported from Figma (PNG @3x) | `.png` (3x), numbered 01–07 in play order — listed in `src/data/phoneScreens.ts` |
| `public/assets/video/` | Any pre-rendered clips | `.mp4` (H.264) |
| `public/assets/fonts/` | Self-hosted fonts | `.woff2` |
| `public/assets/audio/ambience/` | Looping beds: city night, platform hum, tunnel | `.mp3` / `.ogg` |
| `public/assets/audio/sfx/` | One-shots: footsteps, doors, phone buzz, flicker | `.mp3` / `.ogg` |
| `public/assets/audio/pa/` | Station PA announcements | `.mp3` |
| `public/assets/audio/voice/` | Breathing, heartbeat, fake phone call | `.mp3` |
| `public/assets/audio/music/` | End card music | `.mp3` |

Raw, heavy source files (`.blend`, Figma exports, uncompressed `.wav`) go in
`assets-src/`. That folder is ignored by git.


## Optimising a model for the web

```bash
npx gltf-transform optimize assets-src/blender/street.glb public/assets/models/street.glb --compress draco --texture-compress webp
```

## Project layout

```
src/
  App.tsx            phase router: warning → title → start → 3D experience
  Experience.tsx     the <Canvas>; mounts the scene for the current phase
  store.ts           game state (phase, battery, stress)
  theatre/           Theatre.js project + exported state.json
  scenes/            one component per set (PhoneIntro, Street, Platform…)
  components/        reusable 3D pieces (phone, figure, lights)
  ui/                HTML overlays (warning, title, start, end card)
  systems/           game logic hooks (stress, look-away, rituals)
  audio/             sound manager
  data/              scripts, screen lists, statistics
```
