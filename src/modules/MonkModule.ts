import { ChowChow, Module, BaseContext } from '@robb_j/chowchow'
import { Application } from 'express'
import monk, { IMonkManager } from 'monk'

/** How this module extends a ChowChow context */
export type MonkContext = {
  mongo: IMonkManager
}

/**
 * A ChowChow module to add a monk instance to the context
 * -> Adds a required 'MONGO_URL' environment variable be set
 */
export class MonkModule implements Module {
  app: ChowChow = null as any
  db: IMonkManager = null as any

  constructor() {}

  checkEnvironment() {
    const variables = ['MONGO_URL']
    const missing = variables.filter(name => process.env[name] === undefined)

    if (missing.length > 0) {
      throw new Error(`Missing variables: ${missing.join(', ')}`)
    }
  }

  async setupModule() {
    // Start a connection
    const connection = monk(process.env.MONGO_URL!)

    // Monk doesn't play nicely with async/await
    // I think it's because it always has a #then() which ends up recursive
    // IMPORTANT -  resolve this promise **without** a value
    await new Promise<any>((resolve, reject) =>
      connection
        .then(() => resolve())
        .catch(err => reject(new Error(`Mongo error - ${err.message}`)))
    )

    // Now assign the database connection
    this.db = connection
  }

  clearModule() {}

  extendExpress(app: Application) {}

  extendEndpointContext(ctx: BaseContext): MonkContext {
    return { mongo: this.db }
  }
}
