import { RouteContext } from '../../types'

//
// GET /dev/searches ~ Get all analytics stats (only NODE_ENV=development)
//
export default async ({ sendData, mongo }: RouteContext) => {
  let errors = await mongo.get('search_actions').find({})

  sendData(errors)
}
