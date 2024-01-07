import { z } from 'zod'
import type { Example, Schema } from './types.js'

const contactSchema = z.object({})

const typeSchema = z.union([
  z.literal('object'),
  z.literal('string'),
  z.literal('number'),
  z.literal('array'),
  z.literal('Date'),
  z.literal('boolean'),
  z.literal('http'),
])

// this is cursed
const exampleSchema = z.union([
  z.union([z.string(), z.number(), z.boolean()]),
  z.lazy(() => z.array(exampleSchema)),
]) as z.ZodType<Example>

const infoSchema = z.object({
  title: z.string(),
  description: z.string(),
  version: z.string(),
  contact: contactSchema,
})

const bearerSchema = z.object({
  scheme: z.string(),
  bearerFormat: z.string(),
  type: typeSchema,
  in: z.string(),
})

const schemaSchema = z.object({
  type: typeSchema.optional(),
  description: z.string().optional(),
  example: z.union([exampleSchema, z.record(exampleSchema)]).optional(),
  enum: z.array(exampleSchema).optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  required: z.array(z.string()).optional(),
  uniqueItems: z.boolean().optional(),
  format: z.string().optional(),
  default: exampleSchema.optional(),
  properties: z.lazy(() => propertiesSchema).optional(),
  oneOf: z.array(z.lazy(() => schemaSchema)).optional(),
  allOf: z.array(z.lazy(() => schemaSchema)).optional(),
  items: z
    .lazy(() => schemaSchema)
    .nullable() //? this is probably unnecessary but an edge case happened that some $ref was missing and now we're here.
    .optional(),
}) as z.ZodType<Schema>

const securitySchema = z.object({
  bearer: z.array(schemaSchema),
})

const parameterSchema = z.object({
  name: z.string(),
  required: z.boolean(),
  in: z.string(),
  schema: schemaSchema,
})

const applicationJsonSchema = z.object({
  schema: schemaSchema,
})

const securitySchemesSchema = z.object({
  bearer: bearerSchema,
})

const schemasSchema = z.record(schemaSchema)

const propertiesSchema = z.record(schemaSchema)

const contentSchema = z.object({
  'application/json': applicationJsonSchema,
})

const e201Schema = z.object({
  description: z.string(),
  content: contentSchema.optional(),
})

const e200Schema = z.object({
  description: z.string(),
  content: contentSchema.optional(),
})

const e400Schema = z.object({
  description: z.string(),
  content: contentSchema.optional(),
})

const defaultSchema = z.object({
  description: z.string(),
  content: contentSchema,
})

const componentsSchema = z.object({
  securitySchemes: securitySchemesSchema,
  schemas: schemasSchema,
})

const requestBodySchema = z.object({
  required: z.boolean(),
  content: contentSchema,
})

const responsesSchema = z.object({
  '200': e200Schema.optional(),
  '201': e201Schema.optional(),
  '400': e400Schema.optional(),
  default: defaultSchema.optional(),
})

const postSchema = z.object({
  operationId: z.string(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  parameters: z.array(parameterSchema),
  requestBody: requestBodySchema.optional(),
  responses: responsesSchema.optional(),
  security: z.array(securitySchema).optional(),
})

const getSchema = z.object({
  operationId: z.string(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  parameters: z.array(parameterSchema),
  responses: responsesSchema.optional(),
  security: z.array(securitySchema).optional(),
})

const patchSchema = z.object({
  operationId: z.string(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  parameters: z.array(parameterSchema),
  requestBody: requestBodySchema.optional(),
  responses: responsesSchema.optional(),
})

const deleteSchema = z.object({
  operationId: z.string(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  parameters: z.array(parameterSchema),
  requestBody: requestBodySchema.optional(),
  responses: responsesSchema.optional(),
  security: z.array(securitySchema),
})

const pathSchema = z.object({
  post: postSchema.optional(),
  get: getSchema.optional(),
  patch: patchSchema.optional(),
  delete: deleteSchema.optional(),
})

const pathsSchema = z.record(pathSchema)

export const swaggerDocSchema = z.object({
  openapi: z.string(),
  paths: pathsSchema,
  info: infoSchema,
  tags: z.array(z.any()),
  servers: z.array(z.any()),
  components: componentsSchema,
})
