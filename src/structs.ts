import { superstruct, Struct, StructError } from 'superstruct'

const pathRegex = /^[a-zA-Z0-9\/\-\_]+$/

export const struct = superstruct({
  types: {
    path: value => typeof value === 'string' && pathRegex.test(value)
  }
})

export const PageViewBody = struct({
  path: 'path'
})

export const ClientErrorBody = struct({
  message: 'string',
  stack: 'string'
})

export const ProjectActionBody = struct({
  project: 'string',
  link: 'string'
})

export const SearchActionBody = struct({
  search: 'string',
  filters: struct.record(['string', struct.array(['string'])])
})

/** Validate an object against a superstruct schema, throwing any errors */
export function validate<T>(type: Struct, body: any): T {
  const [error, data] = type.validate(body)

  // TODO: Prettify and re-throw the error
  if (error) throw error

  return data
}
