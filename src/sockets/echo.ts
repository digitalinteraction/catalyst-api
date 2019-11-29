import { SocketContext } from '../types'

//
// (type=echo) ~ Just sends back your payload to test things are working
//
export default async ({ socket, body }: SocketContext) => {
  socket.send(JSON.stringify(body))
}
