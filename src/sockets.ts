import { SocketContext } from './types'
import { superstruct, Struct, StructError } from 'superstruct'

const struct = superstruct({
  types: {
    path: value => {
      return typeof value === 'string' && /^[a-zA-Z0-9\/\-\_]+$/.test(value)
    }
  }
})

const PageView = struct({
  path: 'path'
})

const ProjectAction = struct({
  project: 'string',
  link: 'string'
})

type PageView = {
  path: string
}

type ProjectAction = {
  project: string
  link: string
}

type Validation<T> = [StructError | undefined, T]

/** Validate an object against a superstruct schema, throwing any errors */
function validate<T>(type: Struct, body: any): T {
  const [error, data] = type.validate(body) as Validation<T>

  // TODO: Prettify and re-throw the error
  if (error) throw error

  return data
}

//
// (type=echo) ~ Just sends back your payload to test things are working
//
export function echo({ socket, body }: SocketContext) {
  socket.send(JSON.stringify(body))
}

//
// (type=echo) ~ Register a page view
//
export async function pageView({ body, socket, mongo }: SocketContext) {
  const { path } = validate<PageView>(PageView, body)

  // Get the last page view for that session
  const [last] = await mongo
    .get('page_views')
    .find({ session: socket.id }, { $slice: -1 })

  // Create a new page view that optionally references it
  await mongo.get('page_views').insert({
    session: socket.id,
    date: new Date(),
    previous: last ? last._id : null,
    path
  })
}

//
// (type=echo) ~ Register a project action
//
export async function projectAction({ body, socket, mongo }: SocketContext) {
  const { project, link } = validate<ProjectAction>(ProjectAction, body)

  await mongo.get('project_actions').insert({
    session: socket.id,
    date: new Date(),
    project,
    link
  })
}
