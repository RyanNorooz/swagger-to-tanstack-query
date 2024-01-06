import $RefParser from '@apidevtools/json-schema-ref-parser'
import fs from 'fs/promises'
import _ from 'lodash'
import minimist from 'minimist'
import path from 'path'
import prettier from 'prettier'
import { fileURLToPath } from 'url'
import { generateTemplate } from './generateTemplate.js'
import type { SwaggerDoc } from './types.js'

const prettierOptions = {
  ...(await prettier.resolveConfig(fileURLToPath(import.meta.url))),
  parser: 'typescript',
} satisfies prettier.Options

const promises: Promise<void>[] = []

const args = minimist(process.argv)

let url, urlString

try {
  if (!args.url) throw new Error()
  urlString = args.url.replace(/^["|'](.*)["|']$/, '$1') // trim string quotes if they exist
  url = new URL(urlString).toString()
} catch {
  throw new Error('Please provide a valid url. (eg: pnpm start --url=https://api.com/doc-json)', {
    cause: urlString ?? 'No url was given.',
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
const schema = (await $RefParser.dereference(swagger)) as typeof swagger

try {
  await fs.access('./out', fs.constants.F_OK)
  await fs.rm('./out', { recursive: true })
} catch {
  /* empty */
}

// save swagger.json
await fs
  .access('./out/.temp/', fs.constants.F_OK)
  .catch(async () => await fs.mkdir('./out/.temp/', { recursive: true }))

promises.push(fs.writeFile('./out/.temp/swagger.json', JSON.stringify(swagger, undefined, 2)))

const TQ_KEYS: Record<string, string> = {}

const paths = Object.entries(schema.paths)
for (let i = 0; i < paths.length; i++) {
  const [route, _methods] = paths[i]!
  const methods = Object.entries(_methods)

  for (let i = 0; i < methods.length; i++) {
    const [method, details] = methods[i]!
    if (!details.tags?.length) continue

    const tag = _.kebabCase(details.tags[0]?.replaceAll(' ', ''))
    const tagDir = `./out/hooks/${tag}`
    await fs
      .access(tagDir, fs.constants.F_OK)
      .catch(async () => await fs.mkdir(tagDir, { recursive: true }))
    const fileName = _.camelCase(`use ${tag} ${details.operationId.split('_')[1]}`)

    if (method.toLowerCase() === 'get')
      TQ_KEYS[_.snakeCase(fileName.replace('use', '')).toUpperCase()] = _.startCase(
        fileName.replace('use', '')
      )

    let template = generateTemplate({
      fileName,
      route,
      method,
      description: details.summary,
      dto: details.requestBody?.content?.['application/json'].schema,
      params: details.parameters,
      resultExample: Object.entries(details.responses)?.find(([code]) => code.startsWith('20'))?.[1]
        ?.content?.['application/json']?.schema.properties.result,
    })

    template = await prettier.format(template, prettierOptions)

    promises.push(
      fs.writeFile(
        path.join(tagDir, `${fileName}.ts`),
        await prettier.format(template, prettierOptions)
      )
    )
  }
}

promises.push(
  fs.writeFile(
    './out/tq-keys.ts',
    await prettier.format(
      `export const TQ_KEYS = ${JSON.stringify(TQ_KEYS, undefined, 2)}`,
      prettierOptions
    )
  )
)

await Promise.allSettled(promises)

console.log('Generated Hooks are available at `./out` directory.')
