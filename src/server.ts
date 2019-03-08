import { ChowChow } from '@robb_j/chowchow'
import { LoggerModule } from '@robb_j/chowchow-logger'
import { JsonEnvelopeModule } from '@robb_j/chowchow-json-envelope'
import { RedisModule } from './RedisModule'

import cors from 'cors'
import validateEnv from 'valid-env'

import * as routes from './routes'
import { RouteContext } from './types'

// App entrypoint
;(async () => {
  // Ensure required environment variables are set or exit(1)
  validateEnv(['WEB_URL', 'REDIS_URL'])

  // Create our chowchow app and apply modules
  let chow = ChowChow.create<RouteContext>()
    .use(new JsonEnvelopeModule())
    .use(new LoggerModule({ path: 'logs' }))
    .use(new RedisModule(process.env.REDIS_URL!))

  // Setup cors middleware
  chow.applyMiddleware(app => {
    let origin = [process.env.WEB_URL!]
    app.use(cors({ origin }))
  })

  // Add routes to our endpoints
  chow.applyRoutes((app, r) => {
    app.get('/', r(routes.hello))
    app.get('/projects', r(routes.projects))
    app.get('/browse', r(routes.browse))
    app.get('/content', r(routes.content))
  })

  // Start the app up
  await chow.start()
  console.log('Listening on :3000')
})()
