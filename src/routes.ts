import {
  RouteContext,
  Project,
  BrowseMode,
  BrowseModeWithProjects,
  SimpleObject
} from './types'

import { RedisClient } from 'redis'
import shuffleArray from 'shuffle-array'

/** Unpack a project, hydrating it's dates */
function unpackProject(project: Project) {
  project.dateCreated = new Date(project.dateCreated)
  project.dateLastActivity = new Date(project.dateLastActivity)
}

/** Randomise a set and limit it's length */
function limitSet<T>(set: Set<T>, limit: number): Array<T> {
  return shuffleArray(Array.from(set)).slice(0, limit)
}

/** Get a key from redis and parse JSON */
function redisGetJson(redis: RedisClient, key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    redis.get(key, (err, data) => {
      try {
        if (err) throw err
        resolve(JSON.parse(data))
      } catch (error) {
        reject(error)
      }
    })
  })
}

/** Fetch projects from redis and unpack them */
export async function getProjects(redis: RedisClient) {
  const projects = await redisGetJson(redis, 'projects')
  projects.forEach(unpackProject)
  return projects
}

/** Fetch the site config from redis */
export async function getContent(redis: RedisClient) {
  return redisGetJson(redis, 'content')
}

/** Apply a browsing mode by fetching it's projects */
function applyProjects(
  browse: BrowseMode,
  allProjects: Project[]
): BrowseModeWithProjects {
  let matches = allProjects

  // Perform filtering if specified
  if (browse.filter) {
    matches = allProjects.filter(project => {
      switch (browse.type) {
        case 'category':
          return project.category && project.category.name === browse.filter
        case 'theme':
          return project.themes.some(theme => theme.name === browse.filter)
        case 'need':
          return project.needs.some(need => need.name === browse.filter)
        default:
          throw new Error(`Unknown browse: ${JSON.stringify(browse)}`)
      }
    })
  }

  //
  // Perform sorting
  //

  if (browse.type === 'random') {
    //
    // Randomise the selection
    //
    shuffleArray(matches)
  } else if (browse.type === 'recentUpdate') {
    //
    // Sort by last updated first
    //
    matches.sort(
      (a, b) => b.dateLastActivity.getTime() - a.dateLastActivity.getTime()
    )
  } else {
    //
    // Otherwise sort newest first
    //
    matches.sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime())
  }

  // Invert the selection if sorting by oldest (it's sorted newest first by now)
  if (browse.type === 'oldest') matches = matches.reverse()

  return { ...browse, projects: matches }
}

//
// GET / ~ A hello world endpoint
//
export async function hello({ sendData }: RouteContext) {
  sendData({ msg: 'Hey!' })
}

//
// GET /projects ~ list the available projects
//
export async function projects({ sendData, redis }: RouteContext) {
  sendData(await getProjects(redis))
}

//
// GET /browse ~ Dynamically generate ways to browse projects
//
export async function browse({ sendData, redis }: RouteContext) {
  const projects = await getProjects(redis)

  // First find all the categories, needs and themes of the projects
  const categories = new Set<string>()
  const needs = new Set<string>()
  const themes = new Set<string>()

  // Go through projects and add their categories, needs & themes
  for (let project of projects) {
    if (project.category) categories.add(project.category.name)
    for (let need of project.needs) needs.add(need.name)
    for (let theme of project.themes) themes.add(theme.name)
  }

  //
  // Start generating the browsing modes
  //
  // Starting with the different sorting methods
  //
  // NOTE: We aren't using temporal modes as it doesn't currently make sense
  //       for the first deployment i.e. newest, oldest, recentUpdate.
  //       This is where they would be pushed in
  const modes = Array.from<BrowseMode>([
    // { type: 'newest' },
    // { type: 'oldest' },
    // { type: 'recentUpdate' },
    { type: 'random' }
  ])

  // Push in some randomized categories
  for (let category of limitSet(categories, 5)) {
    modes.push({ type: 'category', filter: category })
  }

  // Push in some randomized needs
  for (let need of limitSet(needs, 5)) {
    modes.push({ type: 'need', filter: need })
  }

  // Push in some randomized themes
  for (let theme of limitSet(themes, 5)) {
    modes.push({ type: 'theme', filter: theme })
  }

  // Apply the browsing mode which populates the projects
  const browsing = modes.map(mode => applyProjects(mode, projects))

  // Randomize the modes
  shuffleArray(browsing)

  // send them to the client
  sendData(browsing)
}

//
// GET /dev/stats ~ Get all analytics stats (only NODE_ENV=development)
//
export async function devStats({ sendData, mongo }: RouteContext) {
  let [pageViews, projectActions] = await Promise.all([
    mongo.get('page_views').find({}),
    mongo.get('project_actions').find({})
  ])
  sendData({ pageViews, projectActions })
}

//
// GET /stats ~ Get analytics about the site
//
export async function stats({ sendData, mongo }: RouteContext) {
  const PageView = mongo.get('page_views')
  const ProjectAction = mongo.get('project_actions')

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
  const pageViews: SimpleObject<number> = {}
  for (let view of rawPageViews) {
    pageViews[view.path] = view.count
  }

  // Reduce project arrivals to an object of { source: count }
  const projectSources: SimpleObject<number> = {}
  for (let view of rawProjectArrivals) {
    const key = view.previous[0] ? view.previous[0].path : 'direct'
    projectSources[key] = (projectSources[key] || 0) + 1
  }

  // Reduce interactions to an object of { project: count }
  const interactions: SimpleObject<number> = {}
  for (let action of rawInteractions) {
    interactions[action.project] = action.count
  }

  // Send back the stats data
  sendData({ pageViews, projectSources, interactions })
}

//
// GET /content ~ Fetch the content inferred from the trello board
//
export async function content({ sendData, redis }: RouteContext) {
  sendData(await getContent(redis))
}

export async function notFound({ sendFail }: RouteContext) {
  sendFail(['Not found'], 404)
}
