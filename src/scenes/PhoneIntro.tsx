import { useEffect, useMemo, useState } from 'react'
import { useTexture } from '@react-three/drei'
import { editable as e } from '@theatre/r3f'
import { SRGBColorSpace } from 'three'
import { phoneScreens, phoneScreenUrl } from '../data/phoneScreens'
import { PhonePlaceholder } from '../components/PhonePlaceholder'

/**
 * Phone cutscene. Screens are PNGs from Figma swapped on a timer.
 * Animate the phone and camera in Theatre.js ("Phone" and "Phone Light" objects).
 * Swap <PhonePlaceholder> for your phone .glb once it is in public/assets/models/.
 */
export function PhoneIntro() {
  const urls = useMemo(() => phoneScreens.map((s) => phoneScreenUrl(s.file)), [])
  const textures = useTexture(urls)
  textures.forEach((t) => (t.colorSpace = SRGBColorSpace))

  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (index >= phoneScreens.length - 1) return
    const t = setTimeout(() => setIndex((i) => i + 1), phoneScreens[index].duration * 1000)
    return () => clearTimeout(t)
  }, [index])

  return (
    <>
      <ambientLight intensity={0.1} />
      <e.pointLight theatreKey="Phone Light" position={[0.2, 0.3, 0.5]} intensity={1} />
      <e.group theatreKey="Phone">
        <PhonePlaceholder screen={textures[index]} />
      </e.group>
    </>
  )
}
