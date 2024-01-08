// @ts-nocheck

import type { Schema } from './types.js'

export function generateInterface(schema: Schema, name = 'Name'): string {
  let interfaceString = `{\n`

  const loopOver = (items: Schema) => {
    for (const propName in items) {
      const propSchema = items[propName as keyof typeof items]!
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

function generateType(schema: Schema, name: string): string {
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
  } else if (schema.enum) {
    return schema.enum.join(' | ')
  } else {
    return schema.type ?? 'unknown'
  }
}
