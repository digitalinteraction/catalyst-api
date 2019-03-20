import { SocketContext } from './types'

export function echo({ socket, body }: SocketContext) {
  socket.send(JSON.stringify(body))
}

export function track({ type, body, socket }: SocketContext) {
  console.log(socket.id, type, body)
}
