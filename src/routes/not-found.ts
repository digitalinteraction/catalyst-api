import { RouteContext } from '../types'

export default async ({ sendFail }: RouteContext) => {
  sendFail(['Not found'], 404)
}
