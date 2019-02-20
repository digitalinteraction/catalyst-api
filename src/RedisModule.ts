import { Module, ChowChow } from '@robb_j/chowchow'
import { RedisClient, createClient } from 'redis'

export type RedisContext = {
  redis: RedisClient
}

export class RedisModule implements Module {
  app: ChowChow = null as any
  client: RedisClient = null as any

  constructor(public url: string) {}

  checkEnvironment(): void {}

  async setupModule() {
    this.client = createClient(this.url)
    await new Promise((resolve, reject) => {
      this.client.on('ready', () => resolve())
      this.client.on('error', err => reject(err))
    })
  }

  async clearModule() {
    return new Promise(resolve => this.client.quit(() => resolve()))
  }

  extendExpress(): void {}

  extendEndpointContext(): RedisContext {
    return { redis: this.client }
  }
}
