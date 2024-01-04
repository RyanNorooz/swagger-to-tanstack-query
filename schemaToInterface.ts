type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array'

type JsonSchema = {
  type: JsonSchemaType
  properties?: Record<string, JsonSchema>
  allOf?: JsonSchema[]
  oneOf?: JsonSchema[]
  items?: JsonSchema
  description?: string
  example?: any
  format?: string
  required?: string[]
}

export function generateInterface(schema: JsonSchema, name = 'Name'): string {
  let interfaceString = `{\n`

  const loopOver = (items) => {
    for (const propName in items) {
      const propSchema = items[propName]
      const propType = generateType(propSchema, propName)
      let comment = ''

      if (propSchema.description || propSchema.example) {
        comment += '  /**'
        if (propSchema.description) comment += ' ' + propSchema.description
        if (propSchema.example) comment += ' @example ' + propSchema.example
        comment += ' */\n'
      }

      interfaceString += `${comment}  ${propName}: ${propType}\n`
    }
  }

  if (schema.properties) loopOver(schema.properties)
  if (schema.allOf) loopOver(schema.allOf)
  if (schema.oneOf) loopOver(schema.oneOf)

  interfaceString += '}'

  return interfaceString
}

function generateType(schema: JsonSchema, name: string): string {
  if (schema.type === 'object') {
    const nestedName = `${name.charAt(0).toUpperCase()}${name.slice(1)}`
    return generateInterface(schema, nestedName)
  } else if (schema.type === 'array' && schema.items) {
    if (schema.items.type === 'object') {
      const nestedName = `${name.charAt(0).toUpperCase()}${name.slice(1, -1)}`
      return `${generateInterface(schema.items, nestedName)}[]`
    } else {
      return `${generateType(schema.items, name)}[]`
    }
  } else if (schema.allOf) {
    const types = schema.allOf.map((subSchema, index) => {
      const typeName = `${name}Type${index}`
      return generateType(subSchema, typeName)
    })
    return types.join(' & ')
  } else if (schema.oneOf) {
    const types = schema.oneOf.map((subSchema, index) => {
      const typeName = `${name}Type${index}`
      return generateType(subSchema, typeName)
    })
    return types.join(' | ')
  } else {
    return schema.type === 'integer' ? 'number' : schema.type
  }
}
