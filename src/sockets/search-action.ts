import { SearchAction, SocketContext } from '../types'
import { SearchActionBody, validate } from '../structs'

//
// (type=project_action) ~ Register a project action
//
export default async ({ socket, body, mongo }: SocketContext) => {
  const { search, filters } = validate<SearchAction>(SearchActionBody, body)

  await mongo.get('search_actions').insert({
    session: socket.id,
    date: new Date(),
    search,
    filters
  })
}
