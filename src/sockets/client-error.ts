import { SocketContext, ClientError } from '../types'
import { ClientErrorBody, validate } from '../structs'

//
// (type=page_view) ~ Register a page view
//
export default async ({ socket, body, mongo }: SocketContext) => {
  const { message, stack } = validate<ClientError>(ClientErrorBody, body)

  // Create a new page view that optionally references it
  await mongo.get('client_errors').insert({
    session: socket.id,
    date: new Date(),
    message,
    stack
  })
}
