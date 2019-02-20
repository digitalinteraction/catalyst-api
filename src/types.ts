import { BaseContext } from '@robb_j/chowchow'
import { LoggerContext } from '@robb_j/chowchow-logger'
import { JsonEnvelopeContext } from '@robb_j/chowchow-json-envelope'

import { RedisContext } from './RedisModule'

export type RouteContext = BaseContext &
  LoggerContext &
  JsonEnvelopeContext &
  RedisContext
