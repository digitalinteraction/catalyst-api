import { ProjectAction, SocketContext } from '../types'
import { ProjectActionBody, validate } from '../structs'

//
// (type=project_action) ~ Register a project action
//
export default async ({ socket, body, mongo }: SocketContext) => {
  const { project, link } = validate<ProjectAction>(ProjectActionBody, body)

  await mongo.get('project_actions').insert({
    session: socket.id,
    date: new Date(),
    project,
    link
  })
}
