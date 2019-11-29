import { RouteContext } from '../types'

//
// GET /projects ~ list the available projects
//
export default async ({ sendData, redis }: RouteContext) => {
  sendData(await redis.getJson('projects'))
}
