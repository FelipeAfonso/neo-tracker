import { Canvas, useFrame } from '@react-three/fiber'
import { NextPage } from 'next'
import { useRef, useState } from 'react'
import { Mesh, RepeatWrapping, Texture, TextureLoader } from 'three'

type MeshType = JSX.IntrinsicElements['mesh']

interface SphereProps extends MeshType {
  map: string
  normalMap?: string
  scale?: number
}

const Sphere = (props: SphereProps) => {
  const { map, normalMap, scale, ...meshProps } = props
  const defaulScale = scale ?? 1
  const ref = useRef<Mesh>(null!)

  useFrame(() => (ref.current.rotation.y += 0.01))
  const earthMap = new TextureLoader().load(map)
  const earthNormalMap = normalMap && new TextureLoader().load(normalMap)

  return (
    <mesh {...meshProps} scale={defaulScale} ref={ref}>
      <sphereGeometry />
      <meshStandardMaterial map={earthMap} normalMap={earthNormalMap || undefined} />
    </mesh>
  )
}

const Three: NextPage = () => {
  return (
    <Canvas style={{ height: '100vh', width: '100vw', backgroundColor: '#000' }}>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Sphere
        position={[0, 0, 0]}
        map="assets/earthMap.jpg"
        normalMap="assets/earthNormalMap.jpg"
        scale={0.75}
      />
      <Sphere
        position={[3, 0, 0]}
        map="assets/moonMap.jpg"
        normalMap="assets/moonNormalMap.jpg"
        scale={0.33}
      />
      <Sphere
        position={[-4, 0, 0]}
        map="assets/sunMap.jpg"
        normalMap="assets/sunNormalMap.jpg"
        scale={1.5}
      />
    </Canvas>
  )
}

export default Three
