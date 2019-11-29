import { BaseContext } from '@robb_j/chowchow'
import { LoggerContext } from '@robb_j/chowchow-logger'
import { JsonEnvelopeContext } from '@robb_j/chowchow-json-envelope'

import { RedisContext } from './modules/RedisModule'
import { MonkContext } from './modules/MonkModule'
import { BaseSocketContext, SocketServerContext } from './SocketedChow'

/** Our custom ChowChow context */
export type RouteContext = BaseContext &
  LoggerContext &
  JsonEnvelopeContext &
  RedisContext &
  SocketServerContext &
  MonkContext

/** Our custom context for sockets */
export type SocketContext = BaseSocketContext &
  LoggerContext &
  JsonEnvelopeContext &
  RedisContext &
  MonkContext

/** A trello-card relation */
export type Relation = {
  name: string
  type: string
}

/** A catalyst project */
export type Project = {
  id: string
  name: string
  desc: string
  dateCreated: Date
  dateLastActivity: Date
  category?: Relation
  themes: Relation[]
  needs: Relation[]
}

/** The differnt methods of browsing projects */
export type BrowseType =
  | 'category'
  | 'theme'
  | 'need'
  | 'newest'
  | 'oldest'
  | 'recentUpdate'
  | 'random'

/** A specific method of browsing projects with an optional filter (ie relation id) */
export type BrowseMode = {
  type: BrowseType
  filter?: string
}

/** A browse mode with projects populated */
export type BrowseModeWithProjects = BrowseMode & {
  projects: Project[]
}

export interface PageView {
  path: string
}

export interface ProjectAction {
  project: string
  link: string
}
