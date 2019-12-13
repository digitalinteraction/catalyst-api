import { SocketContext, PageView } from '../types'
import { PageViewBody, validate } from '../structs'

//
// (type=page_view) ~ Register a page view
//
export default async ({ socket, body, mongo }: SocketContext) => {
  const { path } = validate<PageView>(PageViewBody, body)

  // Get the last page view for that session
  const last = await mongo
    .get('page_views')
    .findOne({ session: socket.id }, { sort: { date: -1 } })

  // Create a new page view that optionally references it
  await mongo.get('page_views').insert({
    session: socket.id,
    date: new Date(),
    previous: last ? last._id : null,
    path
  })
}
