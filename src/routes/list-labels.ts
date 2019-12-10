import { RouteContext } from '../types'

//
// GET /data/labels ~ get all labels
//
export default async ({ sendData, redis }: RouteContext) => {
  sendData(await redis.getJson('labels'))
}
