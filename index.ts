import $RefParser from '@apidevtools/json-schema-ref-parser'
import 'dotenv/config'
import fs from 'fs/promises'
import _ from 'lodash'
import path from 'path'
import { generateInterface } from './schemaToInterface.js'
import { SwaggerDoc } from 'types.js'
import minimist from 'minimist'

const args = minimist(process.argv)
if (!args.url) throw new Error('Please provide a url. (eg: bun . --url=https://api.com/doc-json)')

const startTime = performance.now()
console.log('downloading SwaggerDoc...')

const res = await fetch(new URL(args.url).toString())
const blob = await res.blob()
const swaggerJsonText = await blob.text()

const endTime = performance.now()
console.log(`downloading SwaggerDoc took ${(endTime - startTime).toFixed(3)} milliseconds`)

const swagger = JSON.parse(swaggerJsonText) as SwaggerDoc
const schema = (await $RefParser.dereference(swagger)) as typeof swagger

await fs.rm('./out', { recursive: true })
// await fs.access('./out', fs.constants.F_OK).catch(async () => await fs.mkdir('./out'))

// save swagger.json
await fs
  .access('./out/.temp/', fs.constants.F_OK)
  .catch(async () => await fs.mkdir('./out/.temp/', { recursive: true }))
fs.writeFile('./out/.temp/swagger.json', JSON.stringify(swagger, undefined, 2))

const TQ_KEYS: Record<string, string> = {}
const promises: Promise<void>[] = []

const paths = Object.entries(schema.paths)
for (let i = 0; i < paths.length; i++) {
  const [route, _methods] = paths[i]
  const methods = Object.entries(_methods)

  for (let i = 0; i < methods.length; i++) {
    const [method, details] = methods[i]
    if (!details.tags?.length) continue

    const tag = _.kebabCase(details.tags[0].replaceAll(' ', ''))
    const tagDir = `./out/hooks/${tag}`
    await fs
      .access(tagDir, fs.constants.F_OK)
      .catch(async () => await fs.mkdir(tagDir, { recursive: true }))
    const fileName = _.camelCase(`use ${tag} ${details.operationId.split('_')[1]}`)

    if (method.toLowerCase() === 'get')
      TQ_KEYS[_.snakeCase(fileName.replace('use', '')).toUpperCase()] = _.startCase(
        fileName.replace('use', '')
      )

    promises.push(
      fs.writeFile(
        path.join(tagDir, `${fileName}.ts`),
        generateTemplate({
          fileName,
          route,
          method,
          description: details.summary,
          dto: details.requestBody?.content?.['application/json'].schema,
          params: details.parameters,
          resultExample: Object.entries(details.responses)?.find(([code]) =>
            code.startsWith('20')
          )?.[1]?.content?.['application/json']?.schema.properties.result,
        })
      )
    )
  }
}

fs.writeFile('./out/tq-keys.ts', `export const TQ_KEYS = ${JSON.stringify(TQ_KEYS, undefined, 2)}`)

interface GenerateTemplateProps {
  fileName: string
  description?: string
  method: string
  route: string
  dto?: {
    properties: { [key: string]: { type: string; description?: string; example?: string } }
    required?: string[]
  }
  params?: {
    name: string
    required: boolean
    in: string
    example: string
    schema: { type: string }
  }[]
  resultExample?: any
}

function generateTemplate(props: GenerateTemplateProps) {
  const functionName = props.method + props.fileName.replace('use', '')
  const tanstackHookName = ['post', 'patch', 'delete'].includes(props.method)
    ? 'useMutation'
    : 'useQuery'

  const isMutation = tanstackHookName === 'useMutation'
  const isQuery = tanstackHookName === 'useQuery'

  return `import { axiosClient } from '@/lib/axios'${
    props.method.toLowerCase() === 'get'
      ? `
import { TQ_KEYS } from '@/lib/tanstack-query/tq-keys'`
      : ''
  }
import type { ApiResponseDTO } from '@/types/api.ts'
import { ${tanstackHookName} } from '@tanstack/react-query'
${
  props.dto
    ? `
interface ${_.startCase(functionName).replaceAll(' ', '')}DTO ${generateInterface(props.dto)}
`
    : ''
}${
    props.resultExample
      ? `
${
  props.resultExample.description
    ? `/** ${props.resultExample.description} */
`
    : ''
}interface ${_.startCase(functionName).replaceAll(' ', '')}Result ${generateInterface(
          props.resultExample
        )}
`
      : ''
  }
export async function ${functionName}(${
    props.params
      ? props.params
          .map((param) => `${param.name}${param.required ? '' : '?'}: ${param.schema.type}, `)
          .join('')
      : ''
  }${props.dto ? `data: ${_.startCase(functionName).replaceAll(' ', '')}DTO` : ''}) {
  return await axiosClient({
    method: '${props.method.toLowerCase()}',
    url: \`${
      props.params
        ?.filter((p) => p.in === 'path')
        .reduce((acc, cur) => acc.replace(`{${cur.name}}`, `\${${cur.name}}`), props.route) ??
      props.route
    }\`,${
    props.dto
      ? `
    data,`
      : ''
  }
  }) as ApiResponseDTO<${_.startCase(functionName).replaceAll(' ', '')}Result>
}

${props.description ? `/** ${props.description} */` : ''}
export default function ${props.fileName}(${
    props.params
      ? props.params
          .map(
            (param) =>
              `${
                param.example
                  ? `
  /** @example ${param.example} */
  `
                  : ''
              }${param.name}${param.required ? '' : '?'}: ${param.schema.type}, `
          )
          .join('')
      : ''
  }${isQuery && props.dto ? `data: ${_.startCase(functionName).replaceAll(' ', '')}DTO` : ''}) {
  return ${tanstackHookName}({
    ${
      isMutation
        ? `mutationFn: ${
            props.params || props.dto
              ? `(${
                  props.dto ? `data: ${_.startCase(functionName).replaceAll(' ', '')}DTO` : ''
                }) => ${functionName}(${
                  props.params ? props.params.map((param) => `${param.name}, `).join('') : ''
                }${props.dto ? 'data' : ''})`
              : functionName
          },`
        : isQuery
        ? `queryKey: [TQ_KEYS.${_.snakeCase(props.fileName.replace('use', '')).toUpperCase()}],
    queryFn: ${
      props.params || props.dto
        ? `() => ${functionName}(${
            props.params ? props.params.map((param) => `${param.name}, `).join('') : ''
          }${props.dto ? 'data' : ''})`
        : functionName
    },`
        : functionName
    }
  })
}
`
}
