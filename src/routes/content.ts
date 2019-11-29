import { RouteContext } from '../types'

//
// GET /content ~ Fetch the content inferred from the trello board
//
export default async ({ sendData, redis }: RouteContext) => {
  sendData(await redis.getJson('content'))
}
