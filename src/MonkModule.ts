import { ChowChow, Module, BaseContext } from '@robb_j/chowchow'
import { Application } from 'express'
import monk, { IMonkManager } from 'monk'

export type MonkContext = {
  mongo: IMonkManager
}

export class MonkModule implements Module {
  app: ChowChow = null as any
  db: IMonkManager = null as any

  constructor() {}

  checkEnvironment() {
    const variables = ['MONGO_URI']
    const missing = variables.filter(name => process.env[name] === undefined)

    if (missing.length > 0) {
      throw new Error(`Missing variables: ${missing.join(', ')}`)
    }
  }

  async setupModule() {
    this.db = monk(process.env.MONGO_URI!)
  }

  clearModule() {}

  extendExpress(app: Application) {}

  extendEndpointContext(ctx: BaseContext): MonkContext {
    return { mongo: this.db }
  }
}
