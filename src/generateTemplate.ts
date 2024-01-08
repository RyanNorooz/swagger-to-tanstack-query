import _ from 'lodash'
import { generateInterface } from './generateInterface.js'
import type { Parameter, Schema } from './types.js'

interface GenerateTemplateProps {
  fileName: string
  description?: string
  method: string
  route: string
  dto?: Schema
  params?: Parameter[]
  resultExample?: any
  shouldInvalidateQuery: false | string[]
}

export function generateTemplate(props: GenerateTemplateProps) {
  const functionName = props.method + props.fileName.replace('use', '')
  const tanstackHookName = ['post', 'patch', 'delete'].includes(props.method)
    ? 'useMutation'
    : 'useQuery'

  const isMutation = tanstackHookName === 'useMutation'
  const isQuery = tanstackHookName === 'useQuery'

  return `import { axiosClient } from '@/lib/axios'${
    props.method.toLowerCase() === 'get' || props.shouldInvalidateQuery
      ? `
  import { TQ_KEYS } from '@/lib/tanstack-query/tq-keys'`
      : ''
  }
  import type { ApiResponseDTO } from '@/types/api.ts'
  import { ${tanstackHookName}${
    props.shouldInvalidateQuery ? ', useQueryClient' : ''
  } } from '@tanstack/react-query'
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
  }${isQuery && props.dto ? `data: ${_.startCase(functionName).replaceAll(' ', '')}DTO` : ''}) {${
    props.shouldInvalidateQuery ? `\nconst queryClient = useQueryClient()\n` : ''
  }
    return ${tanstackHookName}({
      ${
        isMutation
          ? `mutationKey: ["${_.startCase(props.fileName.replace('use', ''))}"],
      mutationFn: ${
        props.params || props.dto
          ? `(${
              props.dto ? `data: ${_.startCase(functionName).replaceAll(' ', '')}DTO` : ''
            }) => ${functionName}(${
              props.params ? props.params.map((param) => `${param.name}, `).join('') : ''
            }${props.dto ? 'data' : ''})`
          : functionName
      }${
        props.shouldInvalidateQuery
          ? `,\n    onSuccess: () => queryClient.invalidateQueries({ queryKey: [${props.shouldInvalidateQuery
              .map((key) => `TQ_KEYS.${key}`)
              .join(', ')}] })`
          : ''
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
