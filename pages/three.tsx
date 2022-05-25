import { Dialog, Popover, Typography } from '@mui/material'
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber'
import { GetStaticProps, NextPage } from 'next'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MathUtils, Mesh, TextureLoader } from 'three'
import { NasaDailyFeedBase } from '../types/nasa'

type MeshType = JSX.IntrinsicElements['mesh']
interface SphereProps extends MeshType {
  map?: string
  normalMap?: string
  scale?: number
  color?: string
  rotatingSpeed?: number
}

const getRandomPositionWithOffset: (size: number, offset: number) => [number, number, number] = (
  size,
  offset,
) => {
  const pos: [number, number, number] = [
    MathUtils.randFloatSpread(size),
    MathUtils.randFloatSpread(size),
    MathUtils.randFloatSpread(size),
  ]
  if (pos.every((p) => (p >= 0 && p < offset) || (p <= 0 && p > -offset))) {
    return getRandomPositionWithOffset(size, offset)
  }
  return pos
}

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

const Three: NextPage<{ data?: NasaDailyFeedBase }> = ({ data }) => {
  const internallySortedData = useMemo(
    () =>
      Object.values(data?.near_earth_objects ?? {})
        .reduce((a, c) => [...a, ...c], [])
        .map((d) => ({
          ...d,
          close_approach_data: d.close_approach_data?.sort((a, b) =>
            a.epoch_date_close_approach < b.epoch_date_close_approach ? 1 : -1,
          )[0],
        }))
        .sort((a, b) =>
          a.close_approach_data.miss_distance.lunar > b.close_approach_data.miss_distance.lunar
            ? 1
            : -1,
        ),
    [data],
  )

  const [dialogInfo, setDialogInfo] = useState<{
    id?: string
    x?: number
    y?: number
  }>({})

  const handleOpenDialog = useCallback(
    (id: string) => (e: ThreeEvent<PointerEvent>) =>
      setDialogInfo({ id, x: e.nativeEvent.screenX, y: e.nativeEvent.screenY }),
    [setDialogInfo],
  )

  return (
    <>
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
          scale={0.75 / 7}
        />
        <Sphere
          position={[1, 0, 0]}
          map="assets/moonMap.jpg"
          normalMap="assets/moonNormalMap.jpg"
          scale={0.33 / 7}
          rotatingSpeed={0.3}
        />
        <Sphere
          position={[-4, 0, 0]}
          map="assets/sunMap.jpg"
          normalMap="assets/sunNormalMap.jpg"
          scale={1.5 / 7}
          rotatingSpeed={0.1}
        />

        {Array.from(new Array(500))
          .fill(0)
          .map((_, i) => (
            <Sphere
              key={i}
              position={getRandomPositionWithOffset(250, 50)}
              color="#fff"
              scale={Math.random() * 0.1}
              rotatingSpeed={0}
            />
          ))}
        {internallySortedData.map((d, i) => (
          <Sphere
            key={i}
            scale={0.1}
            rotatingSpeed={Math.random() * 0.2}
            onPointerEnter={handleOpenDialog(d.id)}
            onPointerLeave={() => setDialogInfo({})}
            map="assets/asteroidMap.jpg"
            position={[
              0,
              i % 2
                ? Number(d.close_approach_data.miss_distance.lunar) / 50
                : -Number(d.close_approach_data.miss_distance.lunar) / 50,
              0,
            ]}
          />
        ))}
      </Canvas>
      <div
        style={{
          display: dialogInfo.id ? 'block' : 'none',
          position: 'absolute',
          top: (dialogInfo.y ?? 0) - 140,
          left: dialogInfo.x,
          zIndex: 999,
          backgroundColor: 'white',
        }}
      >
        {internallySortedData.find((d) => d.id === dialogInfo.id)?.name}
      </div>
    </>
  )
}

export default Three

export const getStaticProps: GetStaticProps = async () => {
  const res1 = await fetch(
    `https://api.nasa.gov/neo/rest/v1/feed/today?detailed=true&api_key=${process.env.NEO_NASA_KEY}`,
  )
  const data1 = (await res1.json()) as NasaDailyFeedBase
  const res2 = await fetch(data1.links.next)
  const data2 = (await res2.json()) as NasaDailyFeedBase
  const data = {
    links: data1.links,
    element_count: data1.element_count + data2.element_count,
    near_earth_objects: {
      ...data1.near_earth_objects,
      ...data2.near_earth_objects,
    },
  }
  if (res1.status !== 200 || res2.status !== 200) return { notFound: true }
  else return { props: { data }, revalidate: 3600 }
}
