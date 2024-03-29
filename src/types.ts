export interface SwaggerDoc {
  openapi: string
  paths: Paths
  info: Info
  tags: any[]
  servers: any[]
  components: Components
}

interface Paths {
  [key: string]: AtLeastOne<Path>
}

type Path = Partial<Record<'post' | 'get' | 'patch' | 'put' | 'delete', HttpVerb>>

interface HttpVerb {
  operationId: string
  summary?: string
  tags?: string[]
  parameters: Parameter[]
  requestBody?: RequestBody
  responses: Responses
  security?: Security[]
}

export interface Parameter {
  name: string
  required: boolean
  in: string
  example?: Example | { [key: string]: Example }
  schema: Schema
}

interface RequestBody {
  required: boolean
  content: Content
}

interface Content {
  'application/json': ApplicationJson
}

interface ApplicationJson {
  schema: Schema
}

interface Responses {
  '200'?: E200
  '201'?: E201
  '400'?: E400
  default?: Default
}

interface Security {
  bearer: any[]
}

interface E201 {
  description: string
  content?: Content
}

interface E200 {
  description: string
  content?: Content
}

interface E400 {
  description: string
  content?: Content
}

interface Default {
  description: string
  content: Content
}

interface Info {
  title: string
  description: string
  version: string
  contact: Contact
}

// TODO
interface Contact {}

interface Components {
  securitySchemes: SecuritySchemes
  schemas: Schemas
}

// TODO
interface SecuritySchemes {
  bearer: Bearer
}

interface Bearer {
  scheme: string
  bearerFormat: string
  type: Type
  in: string
}

interface Schemas {
  [key: string]: Schema
}

interface Properties {
  [key: string]: Schema
}

export interface Schema {
  type?: Type
  description?: string
  example?: Example | { [key: string]: Example } // TODO: accurate?
  properties?: Properties
  oneOf?: Schema[]
  allOf?: Schema[]
  required?: string[]
  uniqueItems?: boolean
  items?: Schema
  format?: string
  enum?: Example[]
  minimum?: number
  maximum?: number
  default?: Example
}

type Type = 'object' | 'string' | 'number' | 'array' | 'Date' | 'boolean' | 'http'

export type Example = string | number | boolean | Example[] // TODO: wider types?
