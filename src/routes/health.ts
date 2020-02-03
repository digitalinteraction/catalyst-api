import { RouteContext } from '../types'
import { IMonkManager } from 'monk'

async function assertMongo(mongo: IMonkManager) {
  try {
    await mongo.get('page_views').findOne({})
    return false
  } catch (error) {
    return true
  }
}

//
// GET /health ~ Container health endpoint
//
export default async ({ sendData, sendFail, mongo, redis }: RouteContext) => {
  if (await assertMongo(mongo)) return sendFail(['No mongo connection'])

  if (!redis.isConnected()) return sendFail(['No redis connection'])

  sendData({ msg: 'ok' })
}
