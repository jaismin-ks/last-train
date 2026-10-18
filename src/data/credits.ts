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

export type Credit = { what: string; who: string; where: string; license: string; url?: string; whoUrl?: string; todo?: boolean }
export type CreditGroup = { title: string; items: Credit[] }

const sketchfab = (what: string, who: string, license: string, url: string, user: string): Credit => ({
  what,
  who,
  where: 'Sketchfab',
  license,
  url,
  whoUrl: `https://sketchfab.com/${user}`,
})
const blenderkit = (what: string, who: string, license: 'Royalty free' | 'CC0', id: string): Credit => ({
  what,
  who,
  where: 'BlenderKit',
  license,
  url: `https://www.blenderkit.com/asset-gallery-detail/${id}/`,
})
const pixabay = (what: string, who: string, url: string, whoUrl?: string): Credit => ({
  what,
  who,
  where: 'Pixabay',
  license: 'Pixabay Content License',
  url,
  whoUrl,
})

export const CREDITS_INTRO = {
  title: 'Last Train',
  subtitle: 'text me when you get home',
  by: 'A web experience by Jaismin',
}

export const CREDITS: CreditGroup[] = [
  {
    title: '3D models',
    items: [
      sketchfab('Subway Car', 'james_phan', 'CC BY 4.0', 'https://sketchfab.com/3d-models/subway-car-abc21eee368448a4884376ef1fc444fa', 'james_phan'),
      sketchfab('2-Floor Dirty New York Subway Station', 'Qifan Zhang', 'CC BY 4.0', 'https://sketchfab.com/3d-models/2-floor-dirty-new-york-subway-station-e72b88b8177f47769b37b2787bd97300', 'qifanzhang'),
      sketchfab('xander model character man rigged realisitc', 'xander.dice', 'CC BY 4.0', 'https://sketchfab.com/3d-models/xander-model-character-man-rigged-realisitc-ae935d7b05b943b3809c72a781cb074c', 'xander.dice'),
      sketchfab('iPhone 16 – Free', 'Wes (wimell)', 'Sketchfab Free Standard', 'https://sketchfab.com/3d-models/iphone-16-free-d58591e88a824dfd8cef0af616273b02', 'wimell'),
      sketchfab('Subway Entrance V2', 'johnny_3D', 'CC BY 4.0', 'https://sketchfab.com/3d-models/subway-entrance-v2-9bf519fd97ec4685a5d171442494c2a6', 'johhny_3D'),
      sketchfab('Old City Building', 'Steve Morrison', 'CC BY-NC 4.0', 'https://sketchfab.com/3d-models/old-city-building-079f41aea433477788656b65fdea60a4', 'stevemm'),
      sketchfab('old building', 'Helindu', 'CC BY 4.0', 'https://sketchfab.com/3d-models/old-building-5a5defb86867408883f83e99c53f2a01', 'Helindu'),
      sketchfab('Old Residential Building [4k]', 'Andrej Grave', 'CC BY 4.0', 'https://sketchfab.com/3d-models/old-residential-building-4k-dd400ed693cf416e940c5b8e3107205e', 'andrej.grave'),
      sketchfab('Low Poly – Soviet Apartment Building 8K', 'Colin.Greenall', 'CC BY 4.0', 'https://sketchfab.com/3d-models/low-poly-soviet-apartment-building-8k-05229ac1d1f94e6c8cacaad91110c602', 'Colin.Greenall'),
      sketchfab('Detailed 12 storey panel apartment building', 'bean (alwayshasbean)', 'CC BY 4.0', 'https://sketchfab.com/3d-models/detailed-12-storey-panel-apartment-building-cb7064bec48845fea62a830b2c692fb1', 'alwayshasbean'),
      sketchfab('Subway (the station you walk down to the platform)', 'Veterock', 'CC BY 4.0', 'https://sketchfab.com/3d-models/subway-bd022dc78c26444d9a85ef0560733dcc', 'windofglass'),
      sketchfab('Cctv', 'Einheri', 'CC BY 4.0', 'https://sketchfab.com/3d-models/cctv-ac20acbb2d73465eb2cc5a5a4afe1f59', 'Einheri'),
    ],
  },
  {
    title: 'Street assets',
    items: [
      blenderkit('Subway Entrance', 'Zach Hazard Vaupen', 'Royalty free', 'b6deb305-a381-4c8d-b711-a04b99023bd8'),
      blenderkit('Buildings', 'Adam Krhanek', 'Royalty free', '793f6c36-c516-4d6d-9193-0c788388af4e'),
      blenderkit('Building Pack | Lowpoly', 'Fridqeir Haynura', 'Royalty free', '57b02da8-288e-4bf3-b326-b1fdddac89de'),
      blenderkit('Concrete Building | Lowpoly', 'Fridqeir Haynura', 'Royalty free', 'db72a3f9-ed4d-4293-87bd-a1f8ea08c26c'),
      blenderkit('Old Concrete Building', 'Fridqeir Haynura', 'Royalty free', '519ac270-3baa-4d1d-b5ae-46472ec97dc0'),
      blenderkit('Abandoned Concrete Industrial Building', 'Fridqeir Haynura', 'Royalty free', '84a43407-b38f-45f5-b20b-69bcaf8a5193'),
      blenderkit('Derelict Concrete Building', 'Fridqeir Haynura', 'Royalty free', 'e381565d-0afc-4125-acfd-abde83625e8e'),
      blenderkit('Building', 'leilanie wiki', 'Royalty free', 'c60159fd-b17f-4b53-b61b-cd8de8d0e5a7'),
      blenderkit('Apartment Building', 'Abbos Mirzaev', 'Royalty free', 'b769eee0-e568-44f3-a7e7-a4988a527d88'),
      blenderkit('Vintage Street Lamp Post', 'Master Mind', 'Royalty free', '5e747606-b15f-4a19-9527-dcb69910bfac'),
      blenderkit('Stop road sign', 'Alex Samusenko', 'Royalty free', '1ed8fc13-4548-4151-b97a-9486a017a2ee'),
      blenderkit('Outdoor Split Air Conditioner', 'Vavrinec Foltan', 'Royalty free', 'e9331d55-f079-4d03-aa06-3e063ae1f636'),
      blenderkit('City Access Gate Box', 'Calvin Serrano', 'Royalty free', 'c5a0a437-e5ae-450f-bc66-5193ed6c8d79'),
      blenderkit('Electricity city box', 'MapacheDRelease', 'Royalty free', '78dcf1e4-6036-4cf8-a9c2-3ff50a0a870b'),
      blenderkit('Barrier Gate', 'Alojis studio', 'Royalty free', 'f16abec8-c86b-42e4-81aa-92e573c46fa0'),
      blenderkit('Fire hydrant', 'Alojis studio', 'Royalty free', '01a300c5-745e-44c5-9dc1-7f4c76e2a239'),
      blenderkit('Weathered Fire Hydrant', 'Guinter Ramos', 'Royalty free', '00499888-5e46-4545-ab92-259d3352e135'),
      blenderkit('Pinned-Up Papers', 'Mobolaji Dele-Adelodun', 'Royalty free', '40da4a04-af7b-4403-9330-ac4bd87a49cf'),
      blenderkit('Urban Graffiti Wall', 'Gabriela Linhares (GL3D)', 'Royalty free', 'c00863e0-6615-4aae-9fe4-239c152af48d'),
      blenderkit('Brick Wall with Graffiti', 'Gabriela Linhares (GL3D)', 'Royalty free', '5213d569-4735-45a8-96db-2ce5d8aa3f09'),
      blenderkit('Long Brick Wall with Graffiti', 'Gabriela Linhares (GL3D)', 'Royalty free', '12f8cd53-768b-42b8-8c2f-ef8eec535ad5'),
      blenderkit('Road Barrier with Curve & Array Setup', 'Raul Camilov', 'Royalty free', '1cc3ad44-9867-42cc-818f-733ac67ce1cb'),
      blenderkit('Brick Wall', 'James Middleton', 'Royalty free', 'd40f23bb-32c5-454f-b80b-e28fed82eee2'),
      blenderkit('Rusty Chain Link Fence', 'Ashish Kumar Maurya', 'Royalty free', '353f4297-0411-4160-9132-22d92a469e1b'),
      blenderkit('Urban City Bench', 'Rafael Nogueira', 'Royalty free', '03c5a42a-f7bb-4e1e-a15b-057270be18d9'),
      blenderkit('8k Wet road with puddles', 'Mike Red', 'Royalty free', '281cb5dd-a55e-4c67-9750-882511895e10'),
      blenderkit('Asphalt Ground with crack', 'Textures Can', 'Royalty free', '3fdea890-0ef6-4de2-b2ea-f065bda85cf7'),
      blenderkit('Electrical Box (Photoscanned)', 'Nik Kottmann', 'CC0', '8c469e43-6a13-4678-99fb-87fbcd368d91'),
      blenderkit('Poster Pillar (Photoscanned)', 'Nik Kottmann', 'CC0', '74f3a427-f749-427f-b26c-08c3240fd4b8'),
      blenderkit('Utility Box (Photoscanned)', 'Nik Kottmann', 'CC0', '9f77c020-6d7d-403f-8ff0-315ab305dc1d'),
      blenderkit('Utility Box 01', 'Poly Haven', 'CC0', 'fbf21f62-dbae-4d4c-a1af-219387fb8b2d'),
    ],
  },
  {
    title: 'Sound',
    items: [
      pixabay('Subway train arriving', 'Black_River_Phonogram (via freesound_community)', 'https://pixabay.com/sound-effects/city-subway-train-arrive-69678/', 'https://freesound.org/people/Black_River_Phonogram/'),
      pixabay('Subway station chime', 'plasterbrain (via freesound_community)', 'https://pixabay.com/sound-effects/city-subway-station-chime-100558/', 'https://freesound.org/people/plasterbrain/'),
      pixabay('Opening a subway door from the inside', 'derjuli (via freesound_community)', 'https://pixabay.com/sound-effects/city-opening-a-subway-door-from-the-inside-47841/', 'https://freesound.org/people/derjuli/'),
      pixabay('The man laughs madly', 'SakkeSode', 'https://pixabay.com/sound-effects/people-the-man-laughs-madly-182951/'),
      pixabay('Heartbeat 01', 'BRVHRTZ', 'https://pixabay.com/sound-effects/film-special-effects-heartbeat-01-brvhrtz-225058/'),
      pixabay('Emergency alarm', 'NocturnalNarrations (via freesound_community)', 'https://pixabay.com/sound-effects/film-special-effects-emergency-alarm-69780/', 'https://freesound.org/people/NocturnalNarrations/'),
      pixabay('Subway sound (the train running)', 'dpattonwhite (via freesound_community)', 'https://pixabay.com/sound-effects/city-subway-sound-38903/', 'https://freesound.org/people/dpattonwhite/'),
      pixabay('Horror opening (trailer)', 'ArctSound', 'https://pixabay.com/sound-effects/horror-horror-opening-603777/', 'https://pixabay.com/users/arctsound-27113883/'),
      pixabay('Heavy footsteps walking', 'freesound_community', 'https://pixabay.com/sound-effects/household-heavy-footsteps-walking-35722/'),
      pixabay('Eerie ambience', 'Razorrekker (via freesound_community)', 'https://pixabay.com/sound-effects/film-special-effects-eerie-ambience-65606/', 'https://freesound.org/people/Razorrekker/'),
      pixabay('Squeaky escalator', 'AmazingRolo (via freesound_community)', 'https://pixabay.com/sound-effects/technology-squeaky-escalator-25676/', 'https://freesound.org/people/AmazingRolo/'),
      pixabay('iPhone keyboard typing', 'u_a4gfvwagf1', 'https://pixabay.com/sound-effects/film-special-effects-iphone-keyboard-typing-sound-effect-336778/', 'https://pixabay.com/users/u_a4gfvwagf1-50011055/'),
      pixabay('Keys jingling and dropping', 'quantumriver (via freesound_community)', 'https://pixabay.com/sound-effects/film-special-effects-keys-jingling-and-dropping-95249/', 'https://freesound.org/people/quantumriver/'),
      pixabay('Low battery', 'snorcon', 'https://pixabay.com/sound-effects/film-special-effects-low-battery-421820/', 'https://pixabay.com/users/snorcon-52811738/'),
      pixabay('Cough', 'Fabrizio84 (via freesound_community)', 'https://pixabay.com/sound-effects/people-cough-82181/', 'https://freesound.org/people/Fabrizio84/'),
      pixabay('Message envoyé (iPhone)', 'Son_duquotidient', 'https://pixabay.com/sound-effects/film-special-effects-message-envoy%C3%A9-iphone-apple-391098/', 'https://pixabay.com/users/son_duquotidient-44285139/'),
      pixabay('Deep metal clang', 'BlenderDiplom (via freesound_community)', 'https://pixabay.com/sound-effects/film-special-effects-deep-metal-clang-87901/', 'https://freesound.org/people/BlenderDiplom/'),
      ...['Message received', 'Street / station ambience', 'Footsteps on concrete'].map((what) => ({ what, who: '', where: '', license: '', todo: true })),
    ],
  },
  {
    title: 'Images & lighting',
    items: [
      { what: 'Satara Night (No Lamps) — night sky', who: 'Greg Zaal', where: 'Poly Haven', license: 'CC0', url: 'https://polyhaven.com/a/satara_night_no_lamps', whoUrl: 'https://polyhaven.com/all?a=Greg%20Zaal' },
      { what: 'Phone wallpaper photo', who: 'Raspopova Marina', where: 'Unsplash', license: 'Unsplash License', url: 'https://unsplash.com/photos/man-and-woman-taking-selfie-kXuQgf0NrI8', whoUrl: 'https://unsplash.com/@raspopovamarisha' },
    ],
  },
  {
    title: 'Type',
    items: [
      { what: 'Newsreader', who: 'Production Type', where: 'Google Fonts', license: 'SIL Open Font License', url: 'https://fonts.google.com/specimen/Newsreader', whoUrl: 'https://www.productiontype.com/' },
      { what: 'IBM Plex Mono', who: 'IBM, Mike Abbink, Bold Monday', where: 'Google Fonts', license: 'SIL Open Font License', url: 'https://fonts.google.com/specimen/IBM+Plex+Mono', whoUrl: 'https://www.ibm.com/plex/' },
    ],
  },
  {
    title: 'Built with',
    items: [
      { what: 'three.js', who: 'three.js authors', where: '', license: 'MIT', url: 'https://threejs.org/' },
      { what: 'React Three Fiber, drei', who: 'Poimandres', where: '', license: 'MIT', url: 'https://github.com/pmndrs/react-three-fiber', whoUrl: 'https://pmnd.rs/' },
      { what: 'Theatre.js', who: 'Theatre.js contributors', where: '', license: 'Apache 2.0', url: 'https://www.theatrejs.com/' },
      { what: 'howler.js', who: 'James Simpson', where: '', license: 'MIT', url: 'https://howlerjs.com/' },
      { what: 'Coding assistance', who: 'Claude by Anthropic', where: '', license: '', url: 'https://claude.ai/', whoUrl: 'https://www.anthropic.com/' },
    ],
  },
]

/** References: the research behind the end screens, and the support organisations. */
export const REFERENCES: Credit[] = [
  ...ENDING.screens
    .filter((sc) => sc.source)
    .map((sc) => ({ what: sc.lines[0], who: sc.source!, where: '', license: '', url: sc.url })),
  ...RESOURCES.map((r) => ({ what: r.name, who: r.contact, where: 'Support line', license: '', url: r.url, whoUrl: r.href })),
]
