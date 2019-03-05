import { Module, ChowChow } from '@robb_j/chowchow'
import { RedisClient, createClient } from 'redis'

export type RedisContext = {
  redis: RedisClient
}

/** A ChowChow module to connect to and attach a redis client to the ctx */
export class RedisModule implements Module {
  app!: ChowChow
  client!: RedisClient

  /** Create a RedisModule with a redis uri string */
  constructor(public url: string) {}

  checkEnvironment(): void {}

  /** Setup the module by creating and connecting a redis client */
  async setupModule() {
    this.client = createClient(this.url)
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
