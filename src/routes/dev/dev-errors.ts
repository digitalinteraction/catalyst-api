import { RouteContext } from '../../types'

//
// GET /dev/stats ~ Get all analytics stats (only NODE_ENV=development)
//
export default async ({ sendData, mongo }: RouteContext) => {
  let errors = await mongo.get('client_errors').find({})

  sendData(errors)
}
