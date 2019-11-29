import { RouteContext } from '../types'

export default async ({ sendData, redis }: RouteContext) => {
  sendData(redis.getJson('cards'))
}
