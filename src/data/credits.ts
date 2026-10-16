/**
 * Credits for every asset in the game. Sketchfab CC-BY models require credit;
 * BlenderKit royalty-free / CC0, Pixabay, Unsplash and Poly Haven don't, but
 * everyone is credited anyway.
 *
 * Entries with `todo: true` still need their source filled in (they're hidden
 * on the page until then).
 */
import { ENDING } from './ending'
import { RESOURCES } from './captions'

export type Credit = { what: string; who: string; where: string; license: string; url?: string; todo?: boolean }
export type CreditGroup = { title: string; items: Credit[] }

const sketchfab = (what: string, who: string, license: string, url: string): Credit => ({ what, who, where: 'Sketchfab', license, url })
const blenderkit = (what: string, who: string, license: 'Royalty free' | 'CC0'): Credit => ({ what, who, where: 'BlenderKit', license })
const pixabay = (what: string, who: string, url: string): Credit => ({ what, who, where: 'Pixabay', license: 'Pixabay Content License', url })

export const CREDITS_INTRO = {
  title: 'Last Train',
  subtitle: 'text me when you get home',
  by: 'A project by Jaismin',
}

export const CREDITS: CreditGroup[] = [
  {
    title: '3D models',
    items: [
      sketchfab('Subway Car', 'james_phan', 'CC BY 4.0', 'https://sketchfab.com/3d-models/subway-car-abc21eee368448a4884376ef1fc444fa'),
      sketchfab('2-Floor Dirty New York Subway Station', 'Qifan Zhang', 'CC BY 4.0', 'https://sketchfab.com/3d-models/2-floor-dirty-new-york-subway-station-e72b88b8177f47769b37b2787bd97300'),
      sketchfab('xander model character man rigged realisitc', 'xander.dice', 'CC BY 4.0', 'https://sketchfab.com/3d-models/xander-model-character-man-rigged-realisitc-ae935d7b05b943b3809c72a781cb074c'),
      sketchfab('iPhone 16 – Free', 'Wes (wimell)', 'Sketchfab Free Standard', 'https://sketchfab.com/3d-models/iphone-16-free-d58591e88a824dfd8cef0af616273b02'),
      sketchfab('Subway Entrance V2', 'johnny_3D', 'CC BY 4.0', 'https://sketchfab.com/3d-models/subway-entrance-v2-9bf519fd97ec4685a5d171442494c2a6'),
      sketchfab('Old City Building', 'Steve Morrison', 'CC BY-NC 4.0', 'https://sketchfab.com/3d-models/old-city-building-079f41aea433477788656b65fdea60a4'),
      sketchfab('old building', 'Helindu', 'CC BY 4.0', 'https://sketchfab.com/3d-models/old-building-5a5defb86867408883f83e99c53f2a01'),
      sketchfab('Old Residential Building [4k]', 'Andrej Grave', 'CC BY 4.0', 'https://sketchfab.com/3d-models/old-residential-building-4k-dd400ed693cf416e940c5b8e3107205e'),
      sketchfab('Low Poly – Soviet Apartment Building 8K', 'Colin.Greenall', 'CC BY 4.0', 'https://sketchfab.com/3d-models/low-poly-soviet-apartment-building-8k-05229ac1d1f94e6c8cacaad91110c602'),
      sketchfab('Detailed 12 storey panel apartment building', 'bean (alwayshasbean)', 'CC BY 4.0', 'https://sketchfab.com/3d-models/detailed-12-storey-panel-apartment-building-cb7064bec48845fea62a830b2c692fb1'),
      { what: 'Subway station (walk down to the platform)', who: '', where: 'Sketchfab', license: '', todo: true },
      { what: 'CCTV camera', who: '', where: 'Sketchfab', license: '', todo: true },
    ],
  },
  {
    title: 'Street assets',
    items: [
      blenderkit('Subway Entrance', 'Zach Hazard Vaupen', 'Royalty free'),
      blenderkit('Buildings', 'Adam Krhanek', 'Royalty free'),
      blenderkit('Building Pack | Lowpoly', 'Fridqeir Haynura', 'Royalty free'),
      blenderkit('Concrete Building | Lowpoly', 'Fridqeir Haynura', 'Royalty free'),
      blenderkit('Old Concrete Building', 'Fridqeir Haynura', 'Royalty free'),
      blenderkit('Abandoned Concrete Industrial Building', 'Fridqeir Haynura', 'Royalty free'),
      blenderkit('Derelict Concrete Building', 'Fridqeir Haynura', 'Royalty free'),
      blenderkit('Building', 'leilanie wiki', 'Royalty free'),
      blenderkit('Apartment Building', 'Abbos Mirzaev', 'Royalty free'),
      blenderkit('Vintage Street Lamp Post', 'Master Mind', 'Royalty free'),
      blenderkit('Stop road sign', 'Alex Samusenko', 'Royalty free'),
      blenderkit('Outdoor Split Air Conditioner', 'Vavrinec Foltan', 'Royalty free'),
      blenderkit('City Access Gate Box', 'Calvin Serrano', 'Royalty free'),
      blenderkit('Electricity city box', 'MapacheDRelease', 'Royalty free'),
      blenderkit('Barrier Gate', 'Alojis studio', 'Royalty free'),
      blenderkit('Fire hydrant', 'Alojis studio', 'Royalty free'),
      blenderkit('Weathered Fire Hydrant', 'Guinter Ramos', 'Royalty free'),
      blenderkit('Pinned-Up Papers', 'Mobolaji Dele-Adelodun', 'Royalty free'),
      blenderkit('Urban Graffiti Wall', 'Gabriela Linhares (GL3D)', 'Royalty free'),
      blenderkit('Brick Wall with Graffiti', 'Gabriela Linhares (GL3D)', 'Royalty free'),
      blenderkit('Long Brick Wall with Graffiti', 'Gabriela Linhares (GL3D)', 'Royalty free'),
      blenderkit('Road Barrier with Curve & Array Setup', 'Raul Camilov', 'Royalty free'),
      blenderkit('Brick Wall', 'James Middleton', 'Royalty free'),
      blenderkit('Rusty Chain Link Fence', 'Ashish Kumar Maurya', 'Royalty free'),
      blenderkit('Urban City Bench', 'Rafael Nogueira', 'Royalty free'),
      blenderkit('8k Wet road with puddles', 'Mike Red', 'Royalty free'),
      blenderkit('Asphalt Ground with crack', 'Textures Can', 'Royalty free'),
      blenderkit('Electrical Box (Photoscanned)', 'Nik Kottmann', 'CC0'),
      blenderkit('Poster Pillar (Photoscanned)', 'Nik Kottmann', 'CC0'),
      blenderkit('Utility Box (Photoscanned)', 'Nik Kottmann', 'CC0'),
      blenderkit('Utility Box 01', 'Poly Haven', 'CC0'),
    ],
  },
  {
    title: 'Sound',
    items: [
      pixabay('Subway train arriving', 'Black_River_Phonogram (via freesound_community)', 'https://pixabay.com/sound-effects/city-subway-train-arrive-69678/'),
      pixabay('Subway station chime', 'plasterbrain (via freesound_community)', 'https://pixabay.com/sound-effects/city-subway-station-chime-100558/'),
      pixabay('Opening a subway door from the inside', 'derjuli (via freesound_community)', 'https://pixabay.com/sound-effects/city-opening-a-subway-door-from-the-inside-47841/'),
      pixabay('The man laughs madly', 'SakkeSode', 'https://pixabay.com/sound-effects/people-the-man-laughs-madly-182951/'),
      pixabay('Heartbeat 01', 'BRVHRTZ', 'https://pixabay.com/sound-effects/film-special-effects-heartbeat-01-brvhrtz-225058/'),
      pixabay('Heavy footsteps walking', 'freesound_community', 'https://pixabay.com/sound-effects/household-heavy-footsteps-walking-35722/'),
      pixabay('Eerie ambience', 'Razorrekker (via freesound_community)', 'https://pixabay.com/sound-effects/film-special-effects-eerie-ambience-65606/'),
      ...[
        'Escalator hum',
        'Phone typing',
        'Keys jingle',
        'Low battery alert',
        'Man coughing',
        'Second laugh',
        'Message sent / received',
        'Metal gate clang',
        'Street / station ambience',
        'Footsteps on concrete',
      ].map((what) => ({ what, who: '', where: '', license: '', todo: true })),
    ],
  },
  {
    title: 'Images & lighting',
    items: [
      { what: 'Satara Night (No Lamps) — night sky', who: 'Greg Zaal', where: 'Poly Haven', license: 'CC0', url: 'https://polyhaven.com/a/satara_night_no_lamps' },
      { what: 'Phone wallpaper photo', who: 'Raspopova Marina', where: 'Unsplash', license: 'Unsplash License', url: 'https://unsplash.com/photos/man-and-woman-taking-selfie-kXuQgf0NrI8' },
    ],
  },
  {
    title: 'Type',
    items: [
      { what: 'Newsreader', who: 'Production Type', where: 'Google Fonts', license: 'SIL Open Font License' },
      { what: 'IBM Plex Mono', who: 'IBM, Mike Abbink, Bold Monday', where: 'Google Fonts', license: 'SIL Open Font License' },
    ],
  },
  {
    title: 'Built with',
    items: [
      { what: 'three.js, React Three Fiber, drei', who: 'their contributors', where: '', license: 'MIT' },
      { what: 'Theatre.js', who: 'Theatre.js contributors', where: '', license: 'Apache 2.0' },
      { what: 'howler.js', who: 'James Simpson', where: '', license: 'MIT' },
    ],
  },
]

/** References: the research behind the end screens, and the support organisations. */
export const REFERENCES: Credit[] = [
  ...ENDING.screens
    .filter((sc) => sc.source)
    .map((sc) => ({ what: sc.lines[0], who: sc.source!, where: '', license: '', url: sc.url })),
  ...RESOURCES.map((r) => ({ what: r.name, who: r.contact, where: 'Support line', license: '' })),
]
