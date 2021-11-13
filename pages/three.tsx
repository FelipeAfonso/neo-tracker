import { Canvas, useFrame } from '@react-three/fiber'
import { NextPage } from 'next'
import { useEffect, useRef, useState } from 'react'
import {
  Color,
  MathUtils,
  Mesh,
  RepeatWrapping,
  Scene,
  Texture,
  TextureLoader,
  Vector3,
} from 'three'

type MeshType = JSX.IntrinsicElements['mesh']

interface SphereProps extends MeshType {
  map?: string
  normalMap?: string
  scale?: number
  color?: string
  rotatingSpeed?: number
}

const getBackground = () =>
  process.browser ? new TextureLoader().load('assets/background.jpg') : new Color(0xff00ff)
const getRandom = () => MathUtils.randFloatSpread(100) // (Math.random() * 10 + 2) * (Math.random() > 0.5 ? 1 : -1)

const Sphere = (props: SphereProps) => {
  const { map, normalMap, scale, color, rotatingSpeed, ...meshProps } = props
  const defaulScale = scale ?? 1
  const ref = useRef<Mesh>(null!)

  useFrame(() => {
    ref.current.rotation.y += 0.01 * (rotatingSpeed ?? 1) ?? 0.01
  })
  const earthMap = map && new TextureLoader().load(map)
  const earthNormalMap = normalMap && new TextureLoader().load(normalMap)

  return (
    <mesh {...meshProps} scale={defaulScale} ref={ref}>
      <sphereGeometry />
      <meshStandardMaterial
        map={earthMap || undefined}
        color={color}
        normalMap={earthNormalMap || undefined}
      />
    </mesh>
  )
}

const Three: NextPage = () => {
  console.log(getBackground())
  return (
    <Canvas
      style={{
        height: '100vh',
        width: '100vw',
        background: '#000',
      }}
    >
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
        rotatingSpeed={0.3}
      />
      <Sphere
        position={[-4, 0, 0]}
        map="assets/sunMap.jpg"
        normalMap="assets/sunNormalMap.jpg"
        scale={1.5}
        rotatingSpeed={0.1}
      />

      {Array.from(new Array(500))
        .fill(0)
        .map((_, i) => (
          <Sphere
            key={i}
            position={[getRandom(), getRandom(), getRandom()]}
            color="#fff"
            scale={Math.random() * 0.1}
            rotatingSpeed={0}
          />
        ))}
    </Canvas>
  )
}

export default Three
