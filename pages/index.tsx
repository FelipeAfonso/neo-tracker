import type { GetServerSideProps, GetStaticProps, NextPage } from 'next'
import { Box } from '@mui/system'
import { NasaDailyFeedBase } from '../types/nasa'
import { Card, CardContent, Typography } from '@mui/material'
import { formatDistanceToNow, isAfter, isBefore, parse, parseJSON } from 'date-fns'
import { useEffect, useState } from 'react'

const Home: NextPage<{ data?: NasaDailyFeedBase }> = ({ data }) => {
  const internallySortedData = Object.values(data?.near_earth_objects ?? {})
    .reduce((a, c) => [...a, ...c], [])
    .map((d) => ({
      ...d,
      close_approach_data: d.close_approach_data?.sort((a, b) =>
        a.epoch_date_close_approach < b.epoch_date_close_approach ? 1 : -1,
      )[0],
    }))
    .sort((a, b) =>
      a.close_approach_data.epoch_date_close_approach >
      b.close_approach_data.epoch_date_close_approach
        ? 1
        : -1,
    )

  const [timers, setTimers] = useState<string[]>([])
  const [expired, setExpired] = useState<boolean[]>([])

  useEffect(() => {
    setTimeout(() => {
      setTimers(
        internallySortedData.map((d) =>
          formatDistanceToNow(new Date(d.close_approach_data.epoch_date_close_approach)),
        ),
      )
      setExpired(
        internallySortedData.map((d) =>
          isBefore(new Date(d.close_approach_data.epoch_date_close_approach), new Date()),
        ),
      )
    }, 1000)
  })
  return (
    <Box display="flex" flexWrap="wrap" gap={2}>
      {internallySortedData.map((d, i) => (
        <Card
          key={i}
          sx={{
            minWidth: 300,
            bgcolor: expired[i] ? '#bcbcbc' : undefined,
          }}
        >
          <CardContent>
            <Typography
              variant="h5"
              color={d.is_potentially_hazardous_asteroid ? 'error' : 'primary'}
            >
              {d.name}
            </Typography>
            <Typography variant="body1">
              <b>Approach: </b>
              {`${timers[i]} ${expired[i] ? 'ago' : ''}`}
            </Typography>
            <Typography variant="body1">
              <b>Diameter: </b>
              {`${d.estimated_diameter.kilometers.estimated_diameter_min
                .toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })
                .toString()}-${d.estimated_diameter.kilometers.estimated_diameter_max.toLocaleString(
                'en-US',
                {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                },
              )}km`}
            </Typography>
            <Typography variant="body1">
              <b>Miss: </b>
              {Number(d.close_approach_data.miss_distance.lunar).toLocaleString('en-US', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}{' '}
              Lunar Distance
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

export default Home

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
