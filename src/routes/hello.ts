import { RouteContext } from '../types'

//
// GET / ~ A hello world endpoint
//
export default async ({ sendData }: RouteContext) => {
  sendData({ msg: 'Hey!' })
}
