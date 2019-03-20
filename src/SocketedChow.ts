import { BaseContext, ChowChow } from '@robb_j/chowchow'
import { Request, Response, NextFunction } from 'express'
import WebSocket from 'ws'
import uuid from 'uuid/v1'

// For if we want to customise these later ...
// export type Socket = WebSocket
// export type SocketServer = WebSocket.Server

/** Our customised web socket */
export type UniqueSocket = WebSocket & { id: string }

/** A ChowChow route context which adds the socket server */
export type SocketServerContext = {
  socketServer: WebSocket.Server
}

/** The base context for a socket handler */
export type BaseSocketContext = {
  type: string
  body: { [idx: string]: any }
  socket: UniqueSocket
}

/** A handler for a socket connection */
type SocketHandler<SC extends BaseSocketContext> = (
  ctx: SC
) => void | Promise<void>

/** Subclass chowchow to expose the server and express app */
export class SocketedChow<
  RC extends BaseContext,
  SC extends BaseSocketContext
> extends ChowChow<RC> {
  protected socketServer = new WebSocket.Server({ server: this.httpServer })
  protected socketHandlers = new Map<string, SocketHandler<SC>>()

  /** Create a new instance */
  static create<RC extends BaseContext, SC extends BaseSocketContext>() {
    return new SocketedChow<RC, SC>()
  }

  /** Register a socket handler for a given type */
  registerSocket(type: string, s: SocketHandler<SC>) {
    this.socketHandlers.set(type, s)
  }

  /** Add the socketServer to ChowChow routes */
  makeCtx(req: Request, res: Response, next: NextFunction): RC {
    const ctx = super.makeCtx(req, res, next)
    ctx.socketServer = this.socketServer
    return ctx
  }

  /** Make a context for a socket handler */
  makeSocketCtx(type: string, body: any, socket: WebSocket): SC {
    const ctx: any = {
      type,
      body,
      socket: socket,
      socketServer: this.socketServer
    }

    for (let module of this.modules) {
      Object.assign(ctx, module.extendEndpointContext(ctx))
    }

    return ctx
  }

  /** Setup event handlers for a new socket */
  setupSocket(socket: UniqueSocket) {
    // Generate an id for the socket if it doesn't have one
    if (!socket.id) socket.id = this.generateSocketId()

    // Listen for messages from it and handle them
    socket.on('message', async data => {
      try {
        const { type = 'error', ...payload } = JSON.parse(data.toString())
        if (type === 'error') throw new Error('Invalid payload')

        const ctx = this.makeSocketCtx(type, payload, socket)

        const handler = this.socketHandlers.get(type)

        if (!handler) throw new Error(`Invalid type '${type}'`)

        await handler(ctx)
      } catch (error) {
        console.error('Socket error', error.message)
      }
    })
  }

  /** Generate a unique socket id based on uuid/v1 */
  generateSocketId(): string {
    const allIds = new Set<string>()

    // Get all the ids in a O(1) lookup set
    for (let socket of this.socketServer.clients as Set<UniqueSocket>) {
      if (socket.id) allIds.add(socket.id)
    }

    // Generate a new unique id
    let newId = ''
    do newId = uuid()
    while (allIds.has(newId))

    return newId
  }

  async start({ verbose = false, port = 3000, logErrors = true } = {}) {
    const logIfVerbose = verbose ? console.log : () => {}

    // Let ChowChow handle itself
    await super.start({ verbose, port, logErrors })

    // Setup socket events
    logIfVerbose('Setting up sockets')
    this.socketServer.on('connection', ws => this.setupSocket(ws as any))
  }
}
