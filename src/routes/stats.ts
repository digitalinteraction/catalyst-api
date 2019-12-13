import { RouteContext, PageView, ProjectAction } from '../types'

//
// GET /stats ~ Get analytics about the site
//
export default async ({ sendData, mongo }: RouteContext) => {
  const PageView = mongo.get<PageView>('page_views')
  const ProjectAction = mongo.get<ProjectAction>('project_actions')

  // Perform all queries in parallel
  const [rawPageViews, rawProjectArrivals, rawInteractions] = await Promise.all(
    [
      // Get the number of views per page
      PageView.aggregate([
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $project: { _id: 0, path: '$_id', count: '$count' } }
      ]),

      // Get how people arrived at a project from
      PageView.aggregate([
        {
          $match: {
            path: { $regex: /^\/project\/.+$/ }
          }
        },
        {
          $lookup: {
            from: 'page_views',
            localField: 'previous',
            foreignField: '_id',
            as: 'previous'
          }
        }
      ]),

      // Get the interactions per project
      ProjectAction.aggregate([
        { $group: { _id: '$project', count: { $sum: 1 } } },
        { $project: { _id: 0, project: '$_id', count: '$count' } }
      ])
    ]
  )

  // Reduce page views to an object of { url: count }
  const pageViews: Record<string, number> = {}
  for (let view of rawPageViews) {
    pageViews[view.path] = view.count
  }

  // Reduce project arrivals to an object of { source: count }
  const projectSources: Record<string, number> = {}
  for (let view of rawProjectArrivals) {
    const key = view.previous[0] ? view.previous[0].path : 'direct'
    projectSources[key] = (projectSources[key] || 0) + 1
  }

  // Reduce interactions to an object of { project: count }
  const interactions: Record<string, number> = {}
  for (let action of rawInteractions) {
    interactions[action.project] = action.count
  }

  // Send back the stats data
  sendData({ pageViews, projectSources, interactions })
}
