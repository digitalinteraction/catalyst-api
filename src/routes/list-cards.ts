import { RouteContext } from '../types'

//
// GET /data/cards ~ list all cards
//
export default async ({ sendData, redis }: RouteContext) => {
  sendData(await redis.getJson('cards'))
}
