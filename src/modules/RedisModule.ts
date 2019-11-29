import { Module, ChowChow } from '@robb_j/chowchow'
import { RedisClient, createClient } from 'redis'
import { promisify } from 'util'

export type RedisContext = {
  redis: RedisAsyncClient
}

interface RedisAsyncClient {
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
      get: promisify(client.get).bind(client),
      set: promisify(client.set).bind(client),
      quit: promisify(client.quit).bind(client),
      on: client.on.bind(client),
      async getJson(key: string) {
        return JSON.parse(await this.client.get(key))
      }
    } as any
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
