import { RouteContext } from '../types'

//
// GET /dev/stats ~ Get all analytics stats (only NODE_ENV=development)
//
export default async ({ sendData, mongo }: RouteContext) => {
  let [pageViews, projectActions] = await Promise.all([
    mongo.get('page_views').find({}),
    mongo.get('project_actions').find({})
  ])
  sendData({ pageViews, projectActions })
}
