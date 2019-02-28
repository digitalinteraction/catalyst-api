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
  validateEnv(['WEB_URL', 'REDIS_URL'])

  let chow = ChowChow.create<RouteContext>()
    .use(new JsonEnvelopeModule())
    .use(new LoggerModule({ path: 'logs' }))
    .use(new RedisModule(process.env.REDIS_URL!))

  chow.applyMiddleware(app => {
    let origin = [process.env.WEB_URL!]
    app.use(cors({ origin }))
  })

  chow.applyRoutes((app, r) => {
    app.get('/', r(routes.hello))
    app.get('/projects', r(routes.projects))
    app.get('/browse', r(routes.browse))
  })

  await chow.start()
  console.log('Listening on :3000')
})()
