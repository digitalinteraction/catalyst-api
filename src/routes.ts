import { RouteContext } from './types'

export async function hello({ sendData }: RouteContext) {
  sendData({ msg: 'Hey!' })
}

export async function projects({ sendData, redis }: RouteContext) {
  redis.get('projects', (err, data) => {
    if (err) throw err
    sendData(JSON.parse(data))
  })
}

export async function notFound({ sendFail }: RouteContext) {
  sendFail(['Not found'], 404)
}
