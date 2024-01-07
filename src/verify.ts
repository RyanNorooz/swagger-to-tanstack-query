// @ts-nocheck

import dereferenceJsonSchema from 'dereference-json-schema'
import minimist from 'minimist'
import { swaggerDocSchema } from './schemas.js'
import type { SwaggerDoc } from './types.js'

const args = minimist(process.argv)

let url = args._[2]
console.log(url)

try {
  if (!url) throw new Error()
  url = url.replace(/^["|'](.*)["|']$/, '$1') // trim string quotes if they exist
  url = new URL(url).toString()
} catch {
  throw new Error('Please provide a valid url. (eg: pnpm verify https://api.com/doc-json)', {
    cause: url ?? 'No url was given.',
  })
}

const startTime = performance.now()
console.log('downloading SwaggerDoc...')

const res = await fetch(url)
const blob = await res.blob()
const swaggerJsonText = await blob.text()

const endTime = performance.now()
console.log(`downloading SwaggerDoc took ${(endTime - startTime).toFixed(3)} milliseconds`)

const swagger = JSON.parse(swaggerJsonText) as SwaggerDoc
const schema = dereferenceJsonSchema.dereferenceSync(swagger) as typeof swagger

try {
  swaggerDocSchema.parse(schema) satisfies SwaggerDoc
  console.log('Swagger is compatible! you can now safely generate your client code.')
  console.log('run: pnpm generate', url)
} catch (e) {
  console.error('Swagger was not compatible. runing the script will probably result in failure.')
  if (args.verbose) console.log(JSON.stringify(e, undefined, 2))
}
