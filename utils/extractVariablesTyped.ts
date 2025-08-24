import { DocumentSchema, VariableDefinitionType } from '@/lib/dslValidator'

export interface ExtractedVariable {
  name: string
  type: VariableDefinitionType['type']
  label?: string
  required?: boolean
  defaultValue?: string
  placeholder?: string
  helpText?: string
  validation?: any
}

/**
 * Parses extended variable syntax: ${NAME:TYPE:prop1=value1:prop2=value2}
 */
function parseExtendedVariable(match: string): ExtractedVariable | null {
  // Remove ${ and }
  const inner = match.slice(2, -1)
  const parts = inner.split(':')
  
  if (parts.length < 1) return null
  
  const name = parts[0]
  const type = (parts[1] || 'TEXT').toUpperCase() as VariableDefinitionType['type']
  
  const variable: ExtractedVariable = {
    name,
    type,
    required: true, // Default to required
    validation: {}
  }
  
  // Parse additional properties
  for (let i = 2; i < parts.length; i++) {
    const prop = parts[i]
    const eqIndex = prop.indexOf('=')
    
    if (eqIndex > -1) {
      const key = prop.slice(0, eqIndex)
      const value = prop.slice(eqIndex + 1)
      
      switch (key) {
        case 'label':
          variable.label = value
          break
        case 'required':
          variable.required = value === 'true'
          break
        case 'defaultValue':
          variable.defaultValue = value
          break
        case 'placeholder':
          variable.placeholder = value
          break
        case 'helpText':
          variable.helpText = value
          break
        case 'minLength':
          variable.validation.minLength = parseInt(value)
          break
        case 'maxLength':
          variable.validation.maxLength = parseInt(value)
          break
        case 'pattern':
          variable.validation.pattern = value
          break
        case 'min':
          variable.validation.min = parseFloat(value)
          break
        case 'max':
          variable.validation.max = parseFloat(value)
          break
        case 'decimals':
          variable.validation.decimals = parseInt(value)
          break
        case 'minDate':
          variable.validation.minDate = value
          break
        case 'maxDate':
          variable.validation.maxDate = value
          break
        case 'format':
          variable.validation.format = value
          break
        case 'displayFormat':
          variable.validation.displayFormat = value
          break
        case 'defaultCountry':
          variable.validation.defaultCountry = value
          break
        case 'domains':
          variable.validation.domains = value.split(',')
          break
      }
    }
  }
  
  // Set default label if not provided
  if (!variable.label) {
    variable.label = name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
  }
  
  return variable
}

/**
 * Extracts typed variables from a DSL document
 * Returns structured variable information if available, otherwise infers from names
 */
export function extractVariablesTyped(dsl: DocumentSchema | any): ExtractedVariable[] {
  // If variables are defined in the DSL, use them
  if (dsl.variables && dsl.variables.length > 0) {
    return dsl.variables.map((v: any) => ({
      name: v.name,
      type: v.type,
      label: v.label,
      required: v.required !== false, // Default to true
      defaultValue: v.defaultValue,
      placeholder: v.placeholder,
      helpText: v.helpText,
      validation: v.validation
    }))
  }
  
  // Otherwise, extract variables from content with extended syntax
  const variablesMap = new Map<string, ExtractedVariable>()
  
  const extractFromNode = (node: any) => {
    if (!node || typeof node !== 'object') return
    
    // Check content fields in various node types
    const contentFields = ['content', 'text']
    for (const field of contentFields) {
      if (typeof node[field] === 'string') {
        // Match extended syntax: ${NAME:TYPE:prop=value:...}
        const extendedRe = /\$\{([A-Z0-9_]+(?::[^}]*)?)\}/g
        let match
        while ((match = extendedRe.exec(node[field]))) {
          const fullMatch = match[0]
          const parsed = parseExtendedVariable(fullMatch)
          
          if (parsed) {
            // If we've seen this variable before, merge properties (keep first occurrence's properties)
            if (!variablesMap.has(parsed.name)) {
              variablesMap.set(parsed.name, parsed)
            }
          }
        }
      }
    }
    
    // Recursively extract from children
    if (Array.isArray(node.children)) {
      node.children.forEach(extractFromNode)
    }
  }
  
  extractFromNode(dsl)
  
  // Return unique variables preserving order
  return Array.from(variablesMap.values())
}

/**
 * Helper function to get variable by name
 */
export function getVariableDefinition(
  dsl: DocumentSchema | any, 
  variableName: string
): ExtractedVariable | undefined {
  const variables = extractVariablesTyped(dsl)
  return variables.find(v => v.name === variableName)
}

/**
 * Checks if a DSL has typed variables defined
 */
export function hasTypedVariables(dsl: DocumentSchema | any): boolean {
  return !!(dsl && dsl.variables && dsl.variables.length > 0)
}