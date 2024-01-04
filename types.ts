export interface SwaggerDoc {
  openapi: string
  paths: Paths
  info: Info
  tags: any[]
  servers: any[]
  components: Components
}

interface Paths {
  [key: string]: Path
}

interface Path {
  post?: Post
  get?: Get
  patch?: Patch
  delete?: Delete
}

interface Post {
  operationId: string
  summary: string
  tags?: string[]
  parameters: any[]
  requestBody: RequestBody
  responses: Responses
}

interface Get {
  operationId: string
  summary: string
  tags?: string[]
  parameters: Parameter[]
  responses: Responses
  security: Security[]
}

interface Patch {
  operationId: string
  summary: string
  tags?: string[]
  parameters: any[]
  requestBody: RequestBody
  responses: Responses
}

interface Delete {
  operationId: string
  summary: string
  tags?: string[]
  parameters: Parameter5[]
  responses: Responses
  security: Security[]
}

interface RequestBody {
  required: boolean
  content: Content
}

interface N201 {
  description: string
  content?: Content
}

interface N200 {
  description: string
  content?: Content
}

interface N400 {
  description: string
  content?: Content
}
