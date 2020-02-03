import { Module, ChowChow } from '@robb_j/chowchow'
import { RedisClient, createClient } from 'redis'
import { promisify } from 'util'

export type RedisContext = {
  redis: RedisAsyncClient
}

interface RedisAsyncClient {
  isConnected(): boolean
  get(key: string): Promise<string>
  set(key: string, value: string): Promise<void>
  getJson<T = any>(key: string): Promise<T>
  on: RedisClient['on']
  quit(): Promise<void>
}

/** A ChowChow module to connect to and attach a redis client to the ctx */
export class RedisModule implements Module {
  app!: ChowChow
  client!: RedisAsyncClient

  /** Create a RedisModule with a redis uri string */
  constructor(public url: string) {}

  promisifiedRedis(url: string): RedisAsyncClient {
    const client = createClient(url)

    return {
      isConnected: () => client.connected,
      get: promisify(client.get).bind(client),
      set: promisify(client.set).bind(client) as any,
      quit: promisify(client.quit).bind(client) as any,
      on: client.on.bind(client),
      async getJson(key: string) {
        const data: any = await new Promise((resolve, reject) => {
          client.get(key, (err, data) => (err ? reject(err) : resolve(data)))
        })
        return JSON.parse(data)
      }
    }
  }

  checkEnvironment(): void {}

  /** Setup the module by creating and connecting a redis client */
  async setupModule() {
    this.client = this.promisifiedRedis(this.url)

    await new Promise((resolve, reject) => {
      this.client.on('ready', () => resolve())
      this.client.on('error', err => reject(err))
    })
  }

  /** Clear the module by quitting the redis client */
  async clearModule() {
    this.client.quit()
  }

  extendExpress(): void {}

  /** Extend the context by adding the client */
  extendEndpointContext(): RedisContext {
    return { redis: this.client }
  }
}
